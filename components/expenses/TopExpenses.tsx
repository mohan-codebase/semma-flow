'use client';

import React from 'react';
import type { Expense, ExpenseCategory } from '@/types/expense';

interface TopExpensesProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  limit?: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function TopExpenses({ expenses, categories, limit = 5 }: TopExpensesProps) {
  const sorted = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, limit);
  const maxAmt = sorted[0]?.amount ?? 1;

  if (sorted.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
        No expenses yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map((e, i) => {
        const cat = categories.find((c) => c.id === e.category_id);
        const pct = (e.amount / maxAmt) * 100;
        return (
          <div key={e.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 6,
                  background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {e.description}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {fmtDate(e.date)}{cat ? ` · ${cat.name}` : ''}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 13, fontWeight: 800, color: 'var(--text-primary)',
                fontFamily: "'IBM Plex Mono'", flexShrink: 0, marginLeft: 8,
              }}>
                {fmt(e.amount)}
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: cat?.color ?? 'var(--accent-primary)',
                borderRadius: 99, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
