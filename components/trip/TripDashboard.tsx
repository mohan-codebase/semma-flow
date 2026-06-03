'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  BarChart2,
  Ticket,
  CalendarRange,
  Luggage,
  FileText,
  Settings2,
  ChevronRight,
  MoreHorizontal,
  Wallet,
  Coins,
  Users,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import StatCard from '@/components/trip/StatCard';
import Countdown from '@/components/trip/Countdown';
import SettlementCard from '@/components/trip/SettlementCard';
import { computeSettlement } from '@/lib/trip/settlement';
import { formatINR } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import { EXPENSE_CATEGORIES, type Trip, type TripExpense, type TripSettlement, type ExpenseCategory } from '@/lib/trip/types';

const TABLES = ['trip_expenses', 'trip_trips', 'trip_settlements'];

const SPENDING_COLORS = ['#a2a2a2', '#929292', '#c1c1c1', '#b7b7b7', '#717171'];
const PENDING_COLORS = ['#999999', '#cecece', '#adadad', '#afafaf', '#9c9c9c'];

// Per-category accent, matching the hue of the category tags (CategoryBadge).
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Travel: '#a5a5a5',
  Hotel: '#999999',
  Food: '#c1c1c1',
  Fuel: '#a2a2a2',
  Clothing: '#adadad',
  Accessories: '#afafaf',
  Medicine: '#909090',
  Booking: '#919191',
  Miscellaneous: '#a0a0a0',
};

function CircularShareProgress({
  name,
  amount,
  percentage,
  color,
  label = 'share',
}: {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  label?: string;
}) {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);
  const size = (radius + strokeWidth) * 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 120 }}>
      {/* SVG Ring */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          {percentage > 0 && (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                filter: `drop-shadow(0px 0px 6px ${color}80)`,
              }}
            />
          )}
        </svg>
        {/* Center Labels */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
            {percentage}%
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {label}
          </span>
        </div>
      </div>
      {/* Name and Amount */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, fontFamily: "'Outfit', sans-serif" }}>
          {name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          {formatINR(amount)}
        </p>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { href: '/trip', label: 'Overview', icon: LayoutDashboard },
  { href: '/trip/expenses', label: 'Expenses', icon: Receipt },
  { href: '/trip/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/trip/bookings', label: 'Bookings', icon: Ticket },
  { href: '/trip/itinerary', label: 'Itinerary', icon: CalendarRange },
  { href: '/trip/packing', label: 'Packing', icon: Luggage },
  { href: '/trip/documents', label: 'Documents', icon: FileText },
  { href: '/trip/settings', label: 'Settings', icon: Settings2 },
];

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const settlement = useMemo(
    () => computeSettlement(expenses, trip.travelers, settlements),
    [expenses, trip.travelers, settlements],
  );

  // Total spend per category, biggest first — feeds the breakdown bars.
  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    const rows = EXPENSE_CATEGORIES.map((c) => ({ category: c, amount: map.get(c) ?? 0 })).filter((r) => r.amount > 0);
    rows.sort((a, b) => b.amount - a.amount);
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const max = rows.reduce((m, r) => Math.max(m, r.amount), 0);
    return { rows, total, max };
  }, [expenses]);

  // KPI summary — budget vs. spend at a glance.
  const spent = settlement.totalExpenses;
  const budget = trip.total_budget || 0;
  const remaining = budget - spent;
  const pctOfBudget = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPI row */}
      <div className="trip-stats-grid">
        <StatCard label="Total Budget" value={formatINR(budget)} sub="trip budget" icon={<Wallet size={16} />} />
        <StatCard label="Total Spent" value={formatINR(spent)} sub={budget > 0 ? `${pctOfBudget}% of budget` : 'no budget set'} icon={<Receipt size={16} />} />
        <StatCard label="Remaining" value={formatINR(remaining)} sub={remaining >= 0 ? 'left to spend' : 'over budget'} accent={remaining >= 0 ? 'green' : 'red'} icon={<Coins size={16} />} />
        <StatCard label="Per Person" value={formatINR(settlement.sharePerPerson)} sub={`${trip.travelers.length} traveler${trip.travelers.length === 1 ? '' : 's'}`} icon={<Users size={16} />} />
      </div>

      {/* Hero row */}
      <div className="trip-hero-grid">
        <Countdown startDate={trip.start_date} endDate={trip.end_date} tripName={trip.name} />
        <SettlementCard settlement={settlement} tripId={trip.id} settledPayments={settlements} />
      </div>

      <div className="trip-two-grid">
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          Spending by person
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '24px 32px', padding: '12px 12px' }}>
          {trip.travelers.map((t, i) => {
            // How much cash each person actually paid/fronted overall
            const amount = settlement.payments[t] || 0;
            const pct = settlement.totalExpenses > 0 ? Math.round((amount / settlement.totalExpenses) * 100) : 0;
            return (
              <CircularShareProgress
                key={t}
                name={t}
                amount={amount}
                percentage={pct}
                color={SPENDING_COLORS[i % SPENDING_COLORS.length]}
                label="paid"
              />
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          Pending to pay
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '24px 32px', padding: '12px 12px' }}>
          {trip.travelers.map((t, i) => {
            // How much each person still needs to pay (outstanding debt)
            const balance = settlement.balances[t] || 0;
            const amount = balance < 0 ? -balance : 0;
            const pct = (settlement.owed[t] || 0) > 0 ? Math.round((amount / settlement.owed[t]) * 100) : 0;
            return (
              <CircularShareProgress
                key={t}
                name={t}
                amount={amount}
                percentage={pct}
                color={PENDING_COLORS[i % PENDING_COLORS.length]}
                label="pending"
              />
            );
          })}
        </div>
      </Card>
      </div>

      {byCategory.rows.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
              Spending by category
            </h3>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', fontVariantNumeric: 'tabular-nums' }}>
              {formatINR(byCategory.total)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {byCategory.rows.map(({ category, amount }) => {
              const color = CATEGORY_COLORS[category];
              const pct = byCategory.max > 0 ? (amount / byCategory.max) * 100 : 0;
              const shareOfTotal = byCategory.total > 0 ? Math.round((amount / byCategory.total) * 100) : 0;
              return (
                <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 104, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, minWidth: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {category}
                    </span>
                  </div>
                  <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', borderRadius: 999, background: color }}
                    />
                  </div>
                  <div style={{ width: 96, flexShrink: 0, textAlign: 'right' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINR(amount)}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {shareOfTotal}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* More Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 20px',
          borderRadius: 14,
          border: '1px solid var(--border-medium)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 14.5,
          fontWeight: 700,
          transition: 'all 0.15s ease',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <MoreHorizontal size={18} />
        More Options
      </button>

      {/* Navigation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Trip Menu" size="sm">
        <Card padding="none" style={{ overflow: 'hidden', background: 'transparent', border: 'none', boxShadow: 'none' }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }, idx) => {
            const active = href === '/trip';
            return (
              <div key={href}>
                {idx > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: 'var(--border-subtle)',
                      marginLeft: 62,
                    }}
                  />
                )}
                <Link
                  href={href}
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 20px',
                    background: active ? 'var(--accent-glow)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: active ? 'var(--accent-glow-md)' : 'rgba(85, 85, 85, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={active ? 'var(--accent-primary)' : '#555555'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14.5,
                        fontWeight: active ? 700 : 600,
                        color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {label}
                    </p>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </Link>
              </div>
            );
          })}
        </Card>
      </Modal>
    </div>
  );
}


