'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CategoryBadge from '@/components/trip/CategoryBadge';
import { formatDate, formatINR } from '@/lib/trip/format';
import { expensePayers, expenseShares } from '@/lib/trip/settlement';
import type { TripExpense, Trip } from '@/lib/trip/types';
import { createClient } from '@/lib/supabase/client';



// "Mohan" for a single payer, "Mohan ₹600 · Charles ₹486" when several paid.
function paidByLabel(e: TripExpense): string {
  const payers = expensePayers(e);
  const names = Object.keys(payers);
  if (names.length <= 1) return e.paid_by;
  return names.map((n) => `${n} ${formatINR(payers[n])}`).join(' · ');
}

const rowLabel: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  fontWeight: 500,
};

const rowValue: React.CSSProperties = {
  fontSize: 13.5,
  color: 'var(--text-secondary)',
  fontWeight: 500,
  textAlign: 'right',
};

export default function ExpenseDetailModal({
  expense,
  trip,
  onClose,
  onEdit,
  onDelete,
  onToggleSettled,
}: {
  expense: TripExpense | null;
  trip: Trip;
  onClose: () => void;
  onEdit: (e: TripExpense) => void;
  onDelete: (e: TripExpense) => void;
  onToggleSettled: (e: TripExpense) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  if (!expense) return <Modal isOpen={false} onClose={onClose} title="" size="md" children={null} />;

  const e = expense;
  const shares = expenseShares(e, trip.travelers);
  const canSettle = shares.length > 0 || e.settled;

  async function handleToggle() {
    setBusy(true);
    await onToggleSettled(e);
    setBusy(false);
  }

  async function handleViewReceipt() {
    if (!e.receipt_path) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage.from('trip-documents').createSignedUrl(e.receipt_path, 60);
    if (error || !data) {
      alert('Could not open receipt link. It may have been deleted.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  return (
    <Modal isOpen={Boolean(expense)} onClose={onClose} title="Expense details" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Title + amount */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 17 }}>{e.item}</span>
              {e.source_url && (
                <a href={e.source_url} target="_blank" rel="noreferrer" aria-label="Open source" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
            <div style={{ marginTop: 6 }}>
              <CategoryBadge category={e.category} />
            </div>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 22, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {formatINR(Number(e.amount))}
          </span>
        </div>

        {/* Detail rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 12 }}>
            <span style={rowLabel}>Paid by</span>
            <span style={rowValue}>{paidByLabel(e)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={rowLabel}>Date</span>
            <span style={rowValue}>{formatDate(e.expense_date)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={rowLabel}>Status</span>
            <span style={{ ...rowValue, fontWeight: !e.settled && shares.length > 0 ? 700 : 500, color: e.settled ? '#adadad' : 'var(--pending, #ff6b6b)' }}>
              {e.settled
                ? 'Settled'
                : `${shares.map((s) => `${s.name} ${formatINR(s.amount)}`).join(' · ')} pending`}
            </span>
          </div>
          {e.notes && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <span style={rowLabel}>Notes</span>
              <span style={{ ...rowValue, color: 'var(--text-muted)', maxWidth: '70%' }}>{e.notes}</span>
            </div>
          )}
          {e.receipt_path && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={rowLabel}>Receipt</span>
              <span style={rowValue}>
                <button
                  onClick={handleViewReceipt}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-light)',
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <ExternalLink size={14} />
                  View receipt
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Actions — settle gets a full-width primary row, Edit/Delete split evenly below. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          {canSettle && (
            <Button
              variant={e.settled ? 'secondary' : 'primary'}
              fullWidth
              loading={busy}
              icon={e.settled ? <CheckCircle2 size={15} /> : <Circle size={15} />}
              onClick={handleToggle}
            >
              {e.settled ? 'Mark as pending' : 'Mark as paid'}
            </Button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Button variant="secondary" fullWidth icon={<Pencil size={15} />} onClick={() => onEdit(e)}>
              Edit
            </Button>
            <Button variant="danger" fullWidth icon={<Trash2 size={15} />} onClick={() => onDelete(e)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
