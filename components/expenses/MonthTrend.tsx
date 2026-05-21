'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { Expense } from '@/types/expense';

interface MonthTrendProps {
  // expenses for the last 6 months (passed from parent, keyed by "YYYY-MM")
  expensesByMonth: { monthKey: string; label: string; total: number }[];
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 12, padding: '12px 16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: "'IBM Plex Mono'" }}>
        {fmt(payload[0].value)}
      </p>
    </div>
  );
}

export default function MonthTrend({ expensesByMonth }: MonthTrendProps) {
  const { delta, pct, direction } = useMemo(() => {
    if (expensesByMonth.length < 2) return { delta: 0, pct: 0, direction: 'same' as const };
    const last = expensesByMonth[expensesByMonth.length - 1].total;
    const prev = expensesByMonth[expensesByMonth.length - 2].total;
    if (prev === 0) return { delta: last, pct: 100, direction: 'up' as const };
    const d = last - prev;
    const p = Math.abs((d / prev) * 100);
    return { delta: d, pct: p, direction: d > 0 ? 'up' as const : d < 0 ? 'down' as const : 'same' as const };
  }, [expensesByMonth]);

  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const trendColor = direction === 'up' ? '#f87171' : direction === 'down' ? 'var(--accent-primary)' : 'var(--text-muted)';
  const trendLabel = direction === 'up'
    ? `${pct.toFixed(1)}% more than last month`
    : direction === 'down'
      ? `${pct.toFixed(1)}% less than last month`
      : 'Same as last month';

  if (expensesByMonth.length < 2) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, color: 'var(--text-muted)', fontSize: 13 }}>
        Need at least 2 months of data
      </div>
    );
  }

  return (
    <div>
      {/* Trend badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: `color-mix(in srgb, ${trendColor} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${trendColor} 25%, transparent)`,
          borderRadius: 99, padding: '4px 10px',
        }}>
          <Icon size={12} style={{ color: trendColor }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: trendColor }}>{trendLabel}</span>
        </div>
        {direction !== 'same' && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {direction === 'up' ? '+' : '-'}{fmt(Math.abs(delta))}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={expensesByMonth} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmt}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="var(--accent-primary)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--accent-primary)', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: 'var(--accent-primary)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Helper to compute monthly totals from flat expense array + month keys
export function computeMonthlyTotals(
  allExpenses: Expense[],
  monthKeys: string[]
): { monthKey: string; label: string; total: number }[] {
  const byMonth = new Map<string, number>();
  for (const e of allExpenses) {
    const mk = e.date.slice(0, 7);
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + e.amount);
  }
  return monthKeys.map((mk) => {
    const [y, m] = mk.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    return { monthKey: mk, label, total: byMonth.get(mk) ?? 0 };
  });
}
