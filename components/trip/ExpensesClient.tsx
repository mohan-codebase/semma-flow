'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import CategoryBadge from '@/components/trip/CategoryBadge';
import ExpenseFormModal from '@/components/trip/ExpenseFormModal';
import ConfirmModal from '@/components/trip/ConfirmModal';
import { Select } from '@/components/trip/fields';
import { tripMutate } from '@/lib/trip/client';
import { exportExpensesToExcel, exportExpensesToPDF } from '@/lib/trip/export';
import { computeSettlement } from '@/lib/trip/settlement';
import { formatDate, formatINR } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import { EXPENSE_CATEGORIES, type TripExpense, type Trip } from '@/lib/trip/types';

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const TABLES = ['trip_expenses'];

const cellPad = '12px 14px';

export default function ExpensesClient({
  expenses,
  userId,
  trip,
}: {
  expenses: TripExpense[];
  userId: string;
  trip: Trip;
}) {
  useTripRealtime(TABLES, userId);
  const router = useRouter();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [person, setPerson] = useState('all');
  const [sort, setSort] = useState<SortKey>('date-desc');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TripExpense | null>(null);
  const [deleting, setDeleting] = useState<TripExpense | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = expenses.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (person !== 'all' && e.paid_by !== person) return false;
      if (q && !`${e.item} ${e.category} ${e.notes ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return a.expense_date.localeCompare(b.expense_date);
        case 'amount-desc':
          return Number(b.amount) - Number(a.amount);
        case 'amount-asc':
          return Number(a.amount) - Number(b.amount);
        default:
          return b.expense_date.localeCompare(a.expense_date);
      }
    });
    return rows;
  }, [expenses, query, category, person, sort]);

  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const settlement = useMemo(() => computeSettlement(expenses, trip.travelers), [expenses, trip.travelers]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(e: TripExpense) {
    setEditing(e);
    setFormOpen(true);
  }
  async function confirmDelete() {
    if (!deleting) return;
    const res = await tripMutate('DELETE', `expenses/${deleting.id}`);
    if (res.ok) {
      toast('Expense deleted', 'success');
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  const iconBtn = (onClick: () => void, label: string, danger = false) => (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        borderRadius: 8,
        background: 'transparent',
        border: 'none',
        color: danger ? 'var(--danger)' : 'var(--text-muted)',
        cursor: 'pointer',
      }}
    >
      {label.startsWith('Edit') ? <Pencil size={15} /> : <Trash2 size={15} />}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }} className="w-full sm:max-w-[320px]">
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, notes…"
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              fontSize: 13.5,
              color: 'var(--text-primary)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }} className="w-full sm:w-auto sm:justify-end">
          <Button variant="secondary" size="sm" icon={<FileSpreadsheet size={15} />} onClick={() => exportExpensesToExcel(filtered)} className="flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button variant="secondary" size="sm" icon={<FileText size={15} />} onClick={() => exportExpensesToPDF(filtered, settlement)} className="flex-1 sm:flex-initial">
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button size="sm" icon={<Plus size={15} />} onClick={openAdd} className="flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Add expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ gap: 8 }} className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="w-full sm:w-[150px]">
          <Select value={category} onChange={setCategory} options={[{ value: 'all', label: 'All categories' }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        </div>
        <div className="w-full sm:w-[130px]">
          <Select value={person} onChange={setPerson} options={[{ value: 'all', label: 'All persons' }, ...trip.travelers.map((t) => ({ value: t, label: t }))]} />
        </div>
        <div className="col-span-2 w-full sm:w-[170px]">
          <Select
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: 'date-desc', label: 'Newest first' },
              { value: 'date-asc', label: 'Oldest first' },
              { value: 'amount-desc', label: 'Amount: high → low' },
              { value: 'amount-asc', label: 'Amount: low → high' },
            ]}
          />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }} className="col-span-2 text-right sm:ml-auto">
          {filtered.length} · {formatINR(filteredTotal)}
        </span>
      </div>

      {/* Table & Mobile list */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt size={26} color="var(--accent-light)" />}
            title={expenses.length === 0 ? 'No expenses yet' : 'No matches'}
            description={
              expenses.length === 0
                ? 'Add your first expense to start tracking the budget and settlement.'
                : 'Try clearing the search or filters.'
            }
            cta={expenses.length === 0 ? <Button icon={<Plus size={15} />} onClick={openAdd}>Add expense</Button> : undefined}
            compact
          />
        </Card>
      ) : (
        <>
          {/* Desktop View (Table) */}
          <Card padding="none" className="hidden md:block">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12 }}>
                    <th style={{ padding: cellPad, fontWeight: 600 }}>Item</th>
                    <th style={{ padding: cellPad, fontWeight: 600 }}>Category</th>
                    <th style={{ padding: cellPad, fontWeight: 600 }}>Paid by</th>
                    <th style={{ padding: cellPad, fontWeight: 600 }}>Date</th>
                    <th style={{ padding: cellPad, fontWeight: 600, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: cellPad, width: 70 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: cellPad, maxWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.item}
                          </span>
                          {e.source_url && (
                            <a href={e.source_url} target="_blank" rel="noreferrer" aria-label="Open source" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                        {e.notes && (
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                            {e.notes}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: cellPad }}>
                        <CategoryBadge category={e.category} />
                      </td>
                      <td style={{ padding: cellPad, color: 'var(--text-secondary)' }}>{e.paid_by}</td>
                      <td style={{ padding: cellPad, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(e.expense_date)}</td>
                      <td style={{ padding: cellPad, textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatINR(Number(e.amount))}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          {iconBtn(() => openEdit(e), 'Edit expense')}
                          {iconBtn(() => setDeleting(e), 'Delete expense', true)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile View (List of stacked cards) */}
          <div className="block md:hidden">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((e) => (
                <div
                  key={e.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--r-xl)',
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, wordBreak: 'break-word' }}>
                          {e.item}
                        </span>
                        {e.source_url && (
                          <a href={e.source_url} target="_blank" rel="noreferrer" aria-label="Open source" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                      {e.notes && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                          {e.notes}
                        </p>
                      )}
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatINR(Number(e.amount))}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <CategoryBadge category={e.category} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{e.paid_by}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(e.expense_date)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {iconBtn(() => openEdit(e), 'Edit expense')}
                      {iconBtn(() => setDeleting(e), 'Delete expense', true)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ExpenseFormModal open={formOpen} onClose={() => setFormOpen(false)} expense={editing} trip={trip} />
      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this expense?"
        description={deleting ? `"${deleting.item}" — ${formatINR(Number(deleting.amount))}` : undefined}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
