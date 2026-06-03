'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import CategoryBadge from '@/components/trip/CategoryBadge';
import ExpenseFormModal from '@/components/trip/ExpenseFormModal';
import ExpenseDetailModal from '@/components/trip/ExpenseDetailModal';
import ConfirmModal from '@/components/trip/ConfirmModal';
import Modal from '@/components/ui/Modal';
import { Select, Field } from '@/components/trip/fields';
import { tripMutate } from '@/lib/trip/client';
import { exportExpensesToExcel, exportExpensesToPDF } from '@/lib/trip/export';
import { computeSettlement, expensePayers, expenseShares } from '@/lib/trip/settlement';
import { formatDate, formatINR } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import { EXPENSE_CATEGORIES, type TripExpense, type Trip, type TripSettlement } from '@/lib/trip/types';

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const TABLES = ['trip_expenses', 'trip_settlements'];

const cellPad = '12px 14px';

export default function ExpensesClient({
  expenses,
  settlements = [],
  userId,
  trip,
}: {
  expenses: TripExpense[];
  settlements?: TripSettlement[];
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<TripExpense | null>(null);
  const [deleting, setDeleting] = useState<TripExpense | null>(null);
  const [viewing, setViewing] = useState<TripExpense | null>(null);

  const activeFilterCount = (category !== 'all' ? 1 : 0) + (person !== 'all' ? 1 : 0);

  function resetFilters() {
    setCategory('all');
    setPerson('all');
    setSort('date-desc');
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = expenses.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (person !== 'all' && !(person in expensePayers(e))) return false;
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
  const settlement = useMemo(() => computeSettlement(expenses, trip.travelers, settlements), [expenses, trip.travelers, settlements]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(e: TripExpense) {
    setEditing(e);
    setFormOpen(true);
  }
  function detailEdit(e: TripExpense) {
    setViewing(null);
    openEdit(e);
  }
  function detailDelete(e: TripExpense) {
    setViewing(null);
    setDeleting(e);
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

  async function toggleSettled(e: TripExpense) {
    const res = await tripMutate('PATCH', `expenses/${e.id}`, { settled: !e.settled });
    if (res.ok) {
      toast(e.settled ? 'Marked as pending' : 'Marked as settled', 'success');
      // Keep the detail modal (if open on this expense) in sync optimistically.
      setViewing((v) => (v && v.id === e.id ? { ...v, settled: !e.settled } : v));
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  // "Mohan" for one payer, "Mohan +1" when several chipped in.
  function payerLabel(e: TripExpense): string {
    const names = Object.keys(expensePayers(e));
    return names.length <= 1 ? e.paid_by : `${e.paid_by} +${names.length - 1}`;
  }

  // Quiet inline status: { text, settled } or null when there's nothing pending.
  function settleStatus(e: TripExpense): { text: string; settled: boolean } | null {
    if (e.settled) return { text: 'Settled', settled: true };
    const shares = expenseShares(e, trip.travelers);
    if (shares.length === 0) return null; // personal — nothing owed
    return { text: `${shares.map((s) => `${s.name} ${formatINR(s.amount)}`).join(' · ')} pending`, settled: false };
  }

  // Short label describing a non-default split (returns null when split among all).
  function splitLabel(e: TripExpense): string | null {
    return null;
  }

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
          <Button
            variant="secondary"
            size="sm"
            icon={<SlidersHorizontal size={15} />}
            onClick={() => setFilterOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  padding: '1px 6px',
                  fontSize: 11,
                  borderRadius: 999,
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontWeight: 800,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button size="sm" icon={<Plus size={15} />} onClick={openAdd} className="flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Add expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Active Filter Chips & Totals */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-muted)',
          paddingBottom: 4,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {activeFilterCount > 0 ? (
            <>
              <span style={{ fontSize: 12 }}>Active filters:</span>
              {category !== 'all' && (
                <div className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px' }}>
                  <span>{category}</span>
                  <button
                    type="button"
                    onClick={() => setCategory('all')}
                    aria-label="Remove category filter"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {person !== 'all' && (
                <div className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px' }}>
                  <span>Paid by: {person}</span>
                  <button
                    type="button"
                    onClick={() => setPerson('all')}
                    aria-label="Remove traveler filter"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--accent-light)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '2px 4px',
                }}
              >
                Clear all
              </button>
            </>
          ) : (
            <span style={{ fontSize: 12.5 }}>Showing all expenses</span>
          )}
        </div>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontSize: 12.5 }}>
          {filtered.length} {filtered.length === 1 ? 'expense' : 'expenses'} ·{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatINR(filteredTotal)}</span>
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setViewing(e)}
                      style={{ borderTop: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: cellPad, maxWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.item}
                          </span>
                          {e.source_url && (
                            <a href={e.source_url} target="_blank" rel="noreferrer" aria-label="Open source" onClick={(ev) => ev.stopPropagation()} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                              <ExternalLink size={13} />
                            </a>
                          )}
                          {e.receipt_path && (
                            <span style={{ color: 'var(--accent-light)', display: 'flex' }} title="Receipt attached">
                              <Paperclip size={13} />
                            </span>
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
                      <td style={{ padding: cellPad, color: 'var(--text-secondary)' }}>
                        {payerLabel(e)}
                        {settleStatus(e) && (
                          <span style={{ display: 'block', fontSize: 11.5, fontWeight: settleStatus(e)!.settled ? 500 : 600, color: settleStatus(e)!.settled ? '#adadad' : 'var(--pending, #ff6b6b)' }}>
                            {settleStatus(e)!.text}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: cellPad, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(e.expense_date)}</td>
                      <td style={{ padding: cellPad, textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatINR(Number(e.amount))}
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
                  onClick={() => setViewing(e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      setViewing(e);
                    }
                  }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--r-xl)',
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, wordBreak: 'break-word' }}>
                          {e.item}
                        </span>
                        {e.source_url && (
                          <a href={e.source_url} target="_blank" rel="noreferrer" aria-label="Open source" onClick={(ev) => ev.stopPropagation()} style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                            <ExternalLink size={13} />
                          </a>
                        )}
                        {e.receipt_path && (
                          <span style={{ color: 'var(--accent-light)', display: 'inline-flex', alignItems: 'center' }} title="Receipt attached">
                            <Paperclip size={13} />
                          </span>
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
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{payerLabel(e)}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(e.expense_date)}</span>

                      {settleStatus(e) && (
                        <>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
                          <span style={{ fontSize: 12, fontWeight: settleStatus(e)!.settled ? 500 : 600, color: settleStatus(e)!.settled ? '#adadad' : 'var(--pending, #ff6b6b)' }}>
                            {settleStatus(e)!.text}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ExpenseDetailModal
        expense={viewing}
        trip={trip}
        onClose={() => setViewing(null)}
        onEdit={detailEdit}
        onDelete={detailDelete}
        onToggleSettled={toggleSettled}
      />
      <ExpenseFormModal open={formOpen} onClose={() => setFormOpen(false)} expense={editing} trip={trip} />
      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this expense?"
        description={deleting ? `"${deleting.item}" — ${formatINR(Number(deleting.amount))}` : undefined}
        onConfirm={confirmDelete}
      />
      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Category">
            <Select
              value={category}
              onChange={setCategory}
              options={[{ value: 'all', label: 'All categories' }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
          </Field>
          <Field label="Paid by">
            <Select
              value={person}
              onChange={setPerson}
              options={[{ value: 'all', label: 'All persons' }, ...trip.travelers.map((t) => ({ value: t, label: t }))]}
            />
          </Field>
          <Field label="Sort order">
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
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <Button variant="secondary" onClick={resetFilters} fullWidth>
                Reset
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <Button onClick={() => setFilterOpen(false)} fullWidth>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
