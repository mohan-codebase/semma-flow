'use client';

import React from 'react';
import { TrendingDown, TrendingUp, PiggyBank, LayoutGrid } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/types/expense';

interface ExpenseSummaryProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  compactMode?: boolean; // only show category breakdown, skip stat cards + budget bar
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function ExpenseSummary({ expenses, categories, compactMode }: ExpenseSummaryProps) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const totalBudget = categories.reduce((s, c) => s + (c.budget ?? 0), 0);
  const remaining = totalBudget > 0 ? totalBudget - total : null;
  const budgetPct = totalBudget > 0 ? Math.min(100, (total / totalBudget) * 100) : null;

  // By category
  const byCat = new Map<string | null, number>();
  for (const e of expenses) {
    byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + e.amount);
  }
  const sorted = [...byCat.entries()]
    .map(([catId, amt]) => ({
      category: categories.find((c) => c.id === catId) ?? null,
      total: amt,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top spend this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTotal = expenses
    .filter((e) => new Date(e.date) >= weekAgo)
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat cards — hidden in compactMode (parent shows them) */}
      {!compactMode && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <StatCard
          label="This month"
          value={fmt(total)}
          icon={<TrendingDown size={16} />}
          color="var(--danger)"
          glow="rgba(239,68,68,0.15)"
        />
        <StatCard
          label="This week"
          value={fmt(weekTotal)}
          icon={<TrendingUp size={16} />}
          color="var(--warm)"
          glow="rgba(251,146,60,0.15)"
        />
      </div>}

      {/* Budget bar — hidden in compactMode */}
      {!compactMode && budgetPct !== null && (
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <PiggyBank size={14} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Monthly Budget</span>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: remaining !== null && remaining < 0 ? '#f87171' : 'var(--accent-primary)',
            }}>
              {remaining !== null && remaining < 0 ? `${fmt(Math.abs(remaining))} over` : remaining !== null ? `${fmt(remaining)} left` : ''}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${budgetPct}%`,
              borderRadius: 99,
              background: budgetPct > 90
                ? 'linear-gradient(90deg, #f87171, #ef4444)'
                : budgetPct > 70
                  ? 'linear-gradient(90deg, var(--warm), #fb923c)'
                  : 'linear-gradient(90deg, var(--accent-primary), var(--accent-light))',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(total)} spent</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(totalBudget)} budget</span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {sorted.length > 0 && (
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <LayoutGrid size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>By Category</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map(({ category, total: catTotal }) => {
              const pct = total > 0 ? (catTotal / total) * 100 : 0;
              const color = category?.color ?? 'var(--text-muted)';
              return (
                <div key={category?.id ?? 'uncategorized'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {category?.name ?? 'Uncategorized'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(catTotal)}</span>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 99,
                      background: color, transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon, color, glow,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; glow: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '14px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: glow, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}
