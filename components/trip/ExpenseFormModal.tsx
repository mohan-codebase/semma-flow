'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Paperclip, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Field, Select, TextField, TextArea } from '@/components/trip/fields';
import { expenseSchema } from '@/lib/trip/schemas';
import { formatINR } from '@/lib/trip/format';
import { expensePayers } from '@/lib/trip/settlement';
import { tripMutate } from '@/lib/trip/client';
import { EXPENSE_CATEGORIES, type TripExpense, type Trip } from '@/lib/trip/types';
import { createClient } from '@/lib/supabase/client';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  category: string;
  item: string;
  amount: string;
  source_url: string;
  notes: string;
  expense_date: string;
  receipt_path: string;
};

const empty = (): FormState => ({
  category: 'Travel',
  item: '',
  amount: '',
  source_url: '',
  notes: '',
  expense_date: todayISO(),
  receipt_path: '',
});

export default function ExpenseFormModal({
  open,
  onClose,
  expense,
  trip,
}: {
  open: boolean;
  onClose: () => void;
  expense?: TripExpense | null;
  trip: Trip;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(expense);
  const allTravelers = trip?.travelers ?? [];
  const defaultTraveler = allTravelers[0] || '';
  const [form, setForm] = useState<FormState>(empty());
  // Who paid. One payer = that person paid the full amount; many = split payment.
  const [payers, setPayers] = useState<string[]>(defaultTraveler ? [defaultTraveler] : []);
  // Per-payer amounts (string inputs), used only when >1 payer is selected.
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const supabase = createClient();
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${trip.user_id}/receipts-${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from('trip-documents').upload(path, file, { upsert: false });
      if (upErr) {
        toast(`Upload failed: ${upErr.message}`, 'error');
        return;
      }
      setForm((f) => ({ ...f, receipt_path: path }));
      toast('Receipt uploaded successfully!', 'success');
    } catch (err: any) {
      toast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemoveReceipt() {
    setForm((f) => ({ ...f, receipt_path: '' }));
  }

  // Every expense is split equally among all current travelers of the trip.
  const splitBetween = allTravelers;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (expense) {
      setForm({
        category: expense.category,
        item: expense.item,
        amount: String(expense.amount),
        source_url: expense.source_url ?? '',
        notes: expense.notes ?? '',
        expense_date: expense.expense_date.slice(0, 10),
        receipt_path: expense.receipt_path ?? '',
      });
      const paid = expensePayers(expense);
      const savedPayers = Object.keys(paid).filter((t) => allTravelers.includes(t));
      setPayers(savedPayers.length > 0 ? savedPayers : defaultTraveler ? [defaultTraveler] : []);
      setPayerAmounts(Object.fromEntries(Object.entries(paid).map(([n, a]) => [n, String(a)])));
    } else {
      setForm(empty());
      setPayers(defaultTraveler ? [defaultTraveler] : []);
      setPayerAmounts({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense]);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const togglePayer = (name: string) =>
    setPayers((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );

  const setPayerAmount = (name: string) => (v: string) =>
    setPayerAmounts((prev) => ({ ...prev, [name]: v }));

  // When 2+ payers are selected and amounts aren't filled, suggest an even split.
  const total = Number(form.amount) || 0;
  const evenSplit = payers.length > 0 ? total / payers.length : 0;
  const paidSum = payers.reduce(
    (s, p) => s + (payerAmounts[p] !== undefined && payerAmounts[p] !== '' ? Number(payerAmounts[p]) || 0 : evenSplit),
    0,
  );
  const remaining = total - paidSum;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (payers.length === 0) {
      setErrors((prev) => ({ ...prev, paid_by: 'Pick at least one person who paid' }));
      return;
    }

    // Single payer → no breakdown (unchanged behaviour). Multiple → record each
    // payer's amount (blank inputs fall back to the even split) and set `paid_by`
    // to the largest contributor.
    let paid_by = payers[0];
    let paid_by_amounts: Record<string, number> | null = null;
    if (payers.length > 1) {
      paid_by_amounts = Object.fromEntries(
        payers.map((p) => [
          p,
          Number((payerAmounts[p] !== undefined && payerAmounts[p] !== '' ? Number(payerAmounts[p]) || 0 : evenSplit).toFixed(2)),
        ]),
      );
      paid_by = payers.reduce((a, b) => (paid_by_amounts![b] > paid_by_amounts![a] ? b : a), payers[0]);
    }

    const parsed = expenseSchema.safeParse({
      trip_id: trip.id,
      ...form,
      paid_by,
      paid_by_amounts,
      split_between: splitBetween,
      amount: form.amount === '' ? 0 : form.amount,
      receipt_path: form.receipt_path || null,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const res = expense
      ? await tripMutate('PATCH', `expenses/${expense.id}`, parsed.data)
      : await tripMutate('POST', 'expenses', parsed.data);
    setSaving(false);
    if (res.ok) {
      toast(editing ? 'Expense updated' : 'Expense added', 'success');
      onClose();
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title={editing ? 'Edit expense' : 'Add expense'} size="md" closeOnOutsideClick={false}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Category">
          <Select value={form.category} onChange={set('category')} options={EXPENSE_CATEGORIES} />
        </Field>

        <Field label="Item" required error={errors.item}>
          <TextField value={form.item} onChange={set('item')} placeholder="e.g. Delhi → Leh flights" />
        </Field>

        <div className="trip-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Amount (₹)" error={errors.amount}>
            <TextField type="number" min={0} step="any" value={form.amount} onChange={set('amount')} placeholder="0" />
          </Field>
          <Field label="Date" required error={errors.expense_date}>
            <TextField type="date" value={form.expense_date} onChange={set('expense_date')} />
          </Field>
        </div>

        <Field label="Paid by" required error={errors.paid_by || errors.paid_by_amounts}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allTravelers.map((t) => {
              const active = payers.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => togglePayer(t)}
                  aria-pressed={active}
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 999,
                    cursor: 'pointer',
                    color: active ? 'var(--accent-light)' : 'var(--text-muted)',
                    background: active ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                    border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          {payers.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {payers.map((p) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{p}</span>
                  <div style={{ width: 130 }}>
                    <TextField
                      type="number"
                      min={0}
                      step="any"
                      value={payerAmounts[p] ?? ''}
                      onChange={setPayerAmount(p)}
                      placeholder={evenSplit > 0 ? evenSplit.toFixed(0) : '0'}
                    />
                  </div>
                </div>
              ))}
              <span style={{ fontSize: 12, color: Math.abs(remaining) < 0.01 ? 'var(--text-muted)' : 'var(--danger)' }}>
                {Math.abs(remaining) < 0.01
                  ? `Adds up to ${formatINR(total)}.`
                  : remaining > 0
                    ? `Remaining: ${formatINR(remaining)} (blank inputs split evenly).`
                    : `Over by ${formatINR(-remaining)}.`}
              </span>
            </div>
          )}
        </Field>

        <Field label="Source URL (optional)" error={errors.source_url}>
          <TextField value={form.source_url} onChange={set('source_url')} placeholder="https://…" />
        </Field>

        <Field label="Notes (optional)" error={errors.notes}>
          <TextArea value={form.notes} onChange={set('notes')} placeholder="Anything to remember…" />
        </Field>

        <Field label="Receipt (optional)">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {form.receipt_path ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <Paperclip size={14} style={{ color: 'var(--accent-light)' }} />
              <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                {form.receipt_path.split('/').pop()?.replace(/^receipts-\d+-/, '')}
              </span>
              <button
                type="button"
                onClick={handleRemoveReceipt}
                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
                title="Remove receipt"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              loading={uploadingReceipt}
              icon={<Paperclip size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingReceipt ? 'Uploading receipt…' : 'Upload receipt'}
            </Button>
          )}
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
