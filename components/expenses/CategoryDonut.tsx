'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Expense, ExpenseCategory } from '@/types/expense';

interface CategoryDonutProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const FALLBACK_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316'];

interface SliceData {
  name: string;
  value: number;
  pct: number;
  color: string;
  count: number;
}


function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SliceData }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 12, padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: d.color, fontFamily: "'IBM Plex Mono'", marginBottom: 4 }}>
        {fmt(d.value)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {d.pct.toFixed(1)}% · {d.count} transaction{d.count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function CategoryDonut({ expenses, categories }: CategoryDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const slices = useMemo<SliceData[]>(() => {
    const map = new Map<string, { value: number; count: number; cat: ExpenseCategory | null }>();

    for (const e of expenses) {
      const key = e.category_id ?? '__none__';
      const cat = categories.find((c) => c.id === e.category_id) ?? null;
      const existing = map.get(key) ?? { value: 0, count: 0, cat };
      map.set(key, { value: existing.value + e.amount, count: existing.count + 1, cat });
    }

    const total = expenses.reduce((s, e) => s + e.amount, 0);

    return [...map.entries()]
      .map(([, { value, count, cat }], i) => ({
        name: cat?.name ?? 'Uncategorized',
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: cat?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const activeSlice = activeIndex !== undefined ? slices[activeIndex] : null;

  if (slices.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
        No data to display
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Donut chart */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              strokeWidth={0}
            >
              {slices.map((s, i) => (
                <Cell
                  key={i}
                  fill={s.color}
                  opacity={activeIndex === undefined || activeIndex === i ? 1 : 0.35}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          {activeSlice ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: activeSlice.color, fontFamily: "'IBM Plex Mono'", lineHeight: 1.2 }}>
                {activeSlice.pct.toFixed(0)}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, maxWidth: 52, lineHeight: 1.3 }}>
                {activeSlice.name}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'IBM Plex Mono'", lineHeight: 1.2 }}>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(total)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>total</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
        {slices.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(undefined)}
            style={{
              cursor: 'default',
              opacity: activeIndex === undefined || activeIndex === i ? 1 : 0.4,
              transition: 'opacity 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0,
                  boxShadow: activeIndex === i ? `0 0 8px ${s.color}` : 'none',
                  transition: 'box-shadow 0.2s',
                }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.pct.toFixed(0)}%</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'IBM Plex Mono'" }}>
                  {fmt(s.value)}
                </span>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${s.pct}%`, borderRadius: 99,
                background: s.color,
                transition: 'width 0.5s ease',
                boxShadow: activeIndex === i ? `0 0 6px ${s.color}` : 'none',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
