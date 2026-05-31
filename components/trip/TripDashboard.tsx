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
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import StatCard from '@/components/trip/StatCard';
import Countdown from '@/components/trip/Countdown';
import SettlementCard from '@/components/trip/SettlementCard';
import { computeSettlement } from '@/lib/trip/settlement';
import { formatINR } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import type { Trip, TripExpense, TripSettlement } from '@/lib/trip/types';

const TABLES = ['trip_expenses', 'trip_trips', 'trip_settlements'];

const COLORS = ['#A78BFA', '#67E8F9', '#F472B6', '#FCA5A5', '#FBBF24', '#34D399'];

function CircularShareProgress({
  name,
  amount,
  percentage,
  color,
}: {
  name: string;
  amount: number;
  percentage: number;
  color: string;
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
            stroke="rgba(255, 255, 255, 0.05)"
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
            share
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero row */}
      <div className="trip-hero-grid">
        <Countdown startDate={trip.start_date} endDate={trip.end_date} tripName={trip.name} />
        <SettlementCard settlement={settlement} tripId={trip.id} settledPayments={settlements} />
      </div>

      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          Expense share by person
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '24px 32px', padding: '12px 12px' }}>
          {trip.travelers.map((t, i) => {
            const amount = settlement.payments[t] || 0;
            const pct = settlement.totalExpenses > 0 ? Math.round((amount / settlement.totalExpenses) * 100) : 0;
            return (
              <CircularShareProgress
                key={t}
                name={t}
                amount={amount}
                percentage={pct}
                color={COLORS[i % COLORS.length]}
              />
            );
          })}
        </div>
      </Card>

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
                      background: active ? 'var(--accent-glow-md)' : 'rgba(124, 58, 237, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={active ? 'var(--accent-primary)' : '#7C3AED'} />
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


