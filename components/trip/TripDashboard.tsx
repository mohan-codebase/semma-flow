'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, Banknote, PiggyBank, Receipt, TrendingDown, Wallet } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatCard from '@/components/trip/StatCard';
import Countdown from '@/components/trip/Countdown';
import SettlementCard from '@/components/trip/SettlementCard';
import CategoryBadge from '@/components/trip/CategoryBadge';
import { computeSettlement } from '@/lib/trip/settlement';
import { formatDate, formatINR } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import type { Trip, TripExpense, TripSettlement } from '@/lib/trip/types';

const TABLES = ['trip_expenses', 'trip_trips', 'trip_settlements'];

export default function TripDashboard({
  trip,
  expenses,
  settlements = [],
  userId,
}: {
  trip: Trip;
  expenses: TripExpense[];
  settlements?: TripSettlement[];
  userId: string;
}) {
  useTripRealtime(TABLES, userId);

  const settlement = useMemo(
    () => computeSettlement(expenses, trip.travelers, settlements),
    [expenses, trip.travelers, settlements],
  );
  const remaining = trip.total_budget - settlement.totalExpenses;
  const usedPct =
    trip.total_budget > 0
      ? Math.min(100, Math.round((settlement.totalExpenses / trip.total_budget) * 100))
      : 0;
  const recent = expenses.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero row */}
      <div className="trip-hero-grid">
        <Countdown startDate={trip.start_date} endDate={trip.end_date} tripName={trip.name} />
        <SettlementCard settlement={settlement} tripId={trip.id} settledPayments={settlements} />
      </div>

      {/* Budget stats */}
      <div className="trip-stats-grid">
        <StatCard label="Total Budget" value={formatINR(trip.total_budget)} icon={<Wallet size={18} />} />
        <StatCard label="Total Expenses" value={formatINR(settlement.totalExpenses)} sub={`${usedPct}% of budget`} icon={<Receipt size={18} />} />
        <StatCard
          label="Remaining"
          value={formatINR(remaining)}
          accent={remaining < 0 ? 'red' : 'green'}
          icon={remaining < 0 ? <TrendingDown size={18} /> : <PiggyBank size={18} />}
        />
        <StatCard label="Expenses Logged" value={String(expenses.length)} icon={<Banknote size={18} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {trip.travelers.map((t) => (
          <StatCard key={t} label={`Paid by ${t}`} value={formatINR(settlement.payments[t] || 0)} />
        ))}
      </div>

      {/* Recent expenses */}
      <Card padding="none">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
            Recent expenses
          </h2>
          <Link
            href="/trip/expenses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p style={{ margin: 0, padding: '0 16px 16px', fontSize: 12.5, color: 'var(--text-muted)' }}>
            No expenses yet — add the first one on the Expenses page.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {recent.map((e) => (
              <li
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.item}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {formatDate(e.expense_date)} · {e.paid_by}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <CategoryBadge category={e.category} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatINR(Number(e.amount))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
