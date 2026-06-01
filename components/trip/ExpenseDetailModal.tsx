'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CategoryBadge from '@/components/trip/CategoryBadge';
import { formatDate, formatINR } from '@/lib/trip/format';
import { expensePayers, expenseShares } from '@/lib/trip/settlement';
import type { TripExpense, Trip } from '@/lib/trip/types';

// Short label describing a non-default split (returns null when split among all).
function splitLabel(e: TripExpense, travelers: string[]): string | null {
  const sharers = e.split_between && e.split_between.length > 0 ? e.split_between : travelers;
  if (sharers.length >= travelers.length) return null; // everyone — the default
  if (sharers.length === 1) return sharers[0] === e.paid_by ? 'Personal' : `For ${sharers[0]}`;
  return `Split: ${sharers.join(', ')}`;
}

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
  const split = splitLabel(e, trip.travelers);
  const canSettle = shares.length > 0 || e.settled;

  async function handleToggle() {
    setBusy(true);
    await onToggleSettled(e);
    setBusy(false);
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
          {split && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={rowLabel}>Split</span>
              <span style={{ ...rowValue, color: 'var(--accent-light)' }}>{split}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={rowLabel}>Status</span>
            <span style={{ ...rowValue, color: e.settled ? '#34D399' : 'var(--text-muted)' }}>
              {e.settled
                ? 'Settled'
                : shares.length === 0
                  ? 'Personal'
                  : `${shares.map((s) => `${s.name} ${formatINR(s.amount)}`).join(' · ')} pending`}
            </span>
          </div>
          {e.notes && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <span style={rowLabel}>Notes</span>
              <span style={{ ...rowValue, color: 'var(--text-muted)', maxWidth: '70%' }}>{e.notes}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexWrap: 'wrap' }}>
          {canSettle && (
            <Button
              variant="secondary"
              loading={busy}
              icon={e.settled ? <CheckCircle2 size={15} color="#34D399" /> : <Circle size={15} />}
              onClick={handleToggle}
              className="flex-1"
            >
              {e.settled ? 'Mark as pending' : 'Mark as paid'}
            </Button>
          )}
          <Button variant="secondary" icon={<Pencil size={15} />} onClick={() => onEdit(e)} className="flex-1">
            Edit
          </Button>
          <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => onDelete(e)} className="flex-1">
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
