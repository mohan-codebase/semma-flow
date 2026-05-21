'use client';

import React, { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Line,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import type { Expense } from '@/types/expense';

interface SpendingChartProps {
  expenses: Expense[];
  monthKey: string;
}

function fmtAmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

interface DayPoint {
  date: string;
  label: string;
  total: number;
  running: number;
  avg: number;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const dayData = payload.find((p) => p.dataKey === 'total');
  const runningData = payload.find((p) => p.dataKey === 'running');
  if (!dayData) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 14,
      padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      minWidth: 160,
    }}>
      <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {format(parseISO(label), 'MMMM d, yyyy')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Spent today</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f87171', fontFamily: "'IBM Plex Mono'" }}>
            {fmtAmt(dayData.value)}
          </span>
        </div>
        {runningData && runningData.value > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Running total</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: "'IBM Plex Mono'" }}>
              {fmtAmt(runningData.value)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpendingChart({ expenses, monthKey }: SpendingChartProps) {
  const data = useMemo<DayPoint[]>(() => {
    const [year, mon] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    const dailyMap = new Map<string, number>();
    for (const e of expenses) {
      dailyMap.set(e.date, (dailyMap.get(e.date) ?? 0) + e.amount);
    }

    const activeDays = [...dailyMap.values()].filter(Boolean);
    const avg = activeDays.length > 0 ? activeDays.reduce((a, b) => a + b, 0) / activeDays.length : 0;

    let running = 0;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const total = dailyMap.get(dateStr) ?? 0;
      running += total;
      return { date: dateStr, label: String(day), total, running, avg };
    });
  }, [expenses, monthKey]);

  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const avgSpend = useMemo(() => {
    const active = data.filter((d) => d.total > 0);
    return active.length > 0 ? active.reduce((s, d) => s + d.total, 0) / active.length : 0;
  }, [data]);
  const peakDay = useMemo(() => data.reduce((m, d) => d.total > m.total ? d : m, data[0]), [data]);
  const monthTotal = data[data.length - 1]?.running ?? 0;

  if (expenses.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 10 }}>
        <span style={{ fontSize: 32 }}>📊</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No spending data for this period</span>
      </div>
    );
  }

  return (
    <div>
      {/* Mini stats row */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
        <MiniStat label="Month total" value={fmtAmt(monthTotal)} color="#f87171" />
        <MiniStat label="Daily avg" value={fmtAmt(avgSpend)} color="var(--indigo)" />
        {peakDay?.total > 0 && (
          <MiniStat
            label={`Peak · ${format(parseISO(peakDay.date), 'MMM d')}`}
            value={fmtAmt(peakDay.total)}
            color="var(--warm)"
          />
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="runningGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              const d = parseInt(v.split('-')[2]);
              return d === 1 || d % 5 === 0 ? String(d) : '';
            }}
          />
          <YAxis
            yAxisId="bar"
            orientation="left"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtAmt}
            domain={[0, maxTotal * 1.3]}
          />
          <YAxis
            yAxisId="running"
            orientation="right"
            tick={{ fontSize: 10, fill: 'rgba(16,185,129,0.5)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtAmt}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', rx: 4 }} />
          {avgSpend > 0 && (
            <ReferenceLine
              yAxisId="bar"
              y={avgSpend}
              stroke="var(--indigo)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              strokeOpacity={0.7}
            />
          )}
          <Area
            yAxisId="running"
            type="monotone"
            dataKey="running"
            stroke="#10B981"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="url(#runningGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#10B981', stroke: 'var(--bg-card)', strokeWidth: 2 }}
          />
          <Bar
            yAxisId="bar"
            dataKey="total"
            fill="url(#barGrad)"
            radius={[3, 3, 0, 0]}
            maxBarSize={12}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 4 }}>
        <LegendItem color="#f87171" label="Daily spend" />
        <LegendItem color="#10B981" label="Running total" line />
        <LegendItem color="var(--indigo)" label="Avg spend" dashed />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'IBM Plex Mono'" }}>{value}</span>
    </div>
  );
}

function LegendItem({ color, label, line, dashed }: { color: string; label: string; line?: boolean; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {dashed ? (
        <div style={{ width: 20, height: 0, borderTop: `2px dashed ${color}`, opacity: 0.8 }} />
      ) : line ? (
        <div style={{ width: 20, height: 2, borderRadius: 1, background: color }} />
      ) : (
        <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      )}
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
