'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { Expense } from '@/types/expense';

interface WeekdaySpendProps {
  expenses: Expense[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmt(n: number) {
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
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--indigo)', fontFamily: "'IBM Plex Mono'" }}>
        {fmt(payload[0].value)}
      </p>
      <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>avg spend</p>
    </div>
  );
}

export default function WeekdaySpend({ expenses }: WeekdaySpendProps) {
  const data = useMemo(() => {
    // avg spend per weekday across all the data
    const totals = Array(7).fill(0);
    const counts = Array(7).fill(0);

    for (const e of expenses) {
      const dow = new Date(e.date + 'T00:00:00').getDay();
      totals[dow] += e.amount;
      counts[dow] += 1;
    }

    return DAYS.map((day, i) => ({
      day,
      avg: counts[i] > 0 ? totals[i] / counts[i] : 0,
      total: totals[i],
      count: counts[i],
    }));
  }, [expenses]);

  const maxAvg = Math.max(...data.map((d) => d.avg), 1);
  const peakDay = data.reduce((m, d) => d.avg > m.avg ? d : m, data[0]);

  if (expenses.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-muted)', fontSize: 13 }}>
        No data yet
      </div>
    );
  }

  return (
    <div>
      {peakDay.avg > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 99, padding: '4px 12px',
            fontSize: 11, fontWeight: 700, color: 'var(--indigo)',
          }}>
            📅 {peakDay.day}s are your heaviest spend day
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="weekdayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="weekdayPeakGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EC4899" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmt}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
          <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.avg === maxAvg ? 'url(#weekdayPeakGrad)' : 'url(#weekdayGrad)'}
                opacity={entry.avg === maxAvg ? 1 : 0.65}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
