'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Settings2, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, PiggyBank, LayoutGrid, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Expense, ExpenseCategory } from '@/types/expense';
import type { ExpenseFormValues, ExpenseCategoryFormValues } from '@/lib/validations/expense';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseList from '@/components/expenses/ExpenseList';
import CategoryManager from '@/components/expenses/CategoryManager';
import SpendingChart from '@/components/expenses/SpendingChart';
import MonthTrend, { computeMonthlyTotals } from '@/components/expenses/MonthTrend';
import TopExpenses from '@/components/expenses/TopExpenses';
import CategoryDonut from '@/components/expenses/CategoryDonut';
import { BudgetRingDetailed } from '@/components/expenses/BudgetRing';
import WeekdaySpend from '@/components/expenses/WeekdaySpend';
import SpendingHeatmap from '@/components/expenses/SpendingHeatmap';

// ─── helpers ────────────────────────────────────────────────────────────────

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMonthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function last6MonthKeys(currentKey: string): string[] {
  const [y, m] = currentKey.split('-').map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(y, m - 1 - (5 - i), 1);
    return toMonthKey(d);
  });
}

const TABS = ['Overview', 'Trends', 'Transactions'] as const;
type Tab = typeof TABS[number];

// ─── page ───────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trendExpenses, setTrendExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthKey, setMonthKey] = useState(() => toMonthKey(new Date()));
  const [tab, setTab] = useState<Tab>('Overview');
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);

  useEffect(() => {
    fetch('/api/expense-categories')
      .then((r) => r.json())
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?month=${monthKey}`);
      const { data } = await res.json();
      setExpenses(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  useEffect(() => {
    const keys = last6MonthKeys(toMonthKey(new Date()));
    Promise.all(
      keys.map((k) => fetch(`/api/expenses?month=${k}`).then((r) => r.json()).then(({ data }) => data ?? []))
    ).then((results) => setTrendExpenses(results.flat()));
  }, []);

  // ── computed ─────────────────────────────────────────────────────────────
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = categories.reduce((s, c) => s + (c.budget ?? 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min(100, (total / totalBudget) * 100) : null;
  const remaining = totalBudget > 0 ? totalBudget - total : null;

  const weekAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; }, []);
  const weekTotal = useMemo(
    () => expenses.filter((e) => new Date(e.date) >= weekAgo).reduce((s, e) => s + e.amount, 0),
    [expenses, weekAgo]
  );

  const spentByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) {
      if (e.category_id) m.set(e.category_id, (m.get(e.category_id) ?? 0) + e.amount);
    }
    return m;
  }, [expenses]);

  const monthlyTrend = useMemo(
    () => computeMonthlyTotals(trendExpenses, last6MonthKeys(toMonthKey(new Date()))),
    [trendExpenses]
  );

  const prevMonth = () => {
    const [y, m] = monthKey.split('-').map(Number);
    setMonthKey(toMonthKey(new Date(y, m - 2, 1)));
  };
  const nextMonth = () => {
    const [y, m] = monthKey.split('-').map(Number);
    setMonthKey(toMonthKey(new Date(y, m, 1)));
  };
  const isCurrentMonth = monthKey === toMonthKey(new Date());

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleSave = async (data: ExpenseFormValues) => {
    if (editingExpense) {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const { data: updated } = await res.json();
      if (updated) setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      const res = await fetch('/api/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const { data: created } = await res.json();
      if (created && created.date.slice(0, 7) === monthKey) {
        setExpenses((prev) => [created, ...prev]);
      }
    }
    setEditingExpense(null);
  };

  const handleDelete = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
  };

  const handleEdit = (expense: Expense) => { setEditingExpense(expense); setFormOpen(true); };

  const handleCatCreate = async (data: ExpenseCategoryFormValues) => {
    const res = await fetch('/api/expense-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const { data: created } = await res.json();
    if (created) setCategories((prev) => [...prev, created]);
  };

  const handleCatUpdate = async (id: string, data: Partial<ExpenseCategoryFormValues>) => {
    const res = await fetch(`/api/expense-categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const { data: updated } = await res.json();
    if (updated) setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleCatDelete = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/expense-categories/${id}`, { method: 'DELETE' });
  };

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="hf-page" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Finance Dashboard
          </p>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Expense Tracker
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {fmtMonthLabel(monthKey)} · {expenses.length} transactions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCatManagerOpen(true)} style={outlineBtnStyle}>
            <Settings2 size={14} /> Categories
          </button>
          <button onClick={() => { setEditingExpense(null); setFormOpen(true); }} style={primaryBtnStyle}>
            <Plus size={14} /> Add Expense
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard
          label="Month total" icon={<TrendingDown size={14} />}
          value={loading ? '—' : fmt(total)}
          sub={`${expenses.length} transactions`}
          color="#f87171" glow="rgba(239,68,68,0.12)"
        />
        <KpiCard
          label="This week" icon={<Receipt size={14} />}
          value={loading ? '—' : fmt(weekTotal)}
          sub="last 7 days"
          color="var(--warm)" glow="rgba(251,146,60,0.12)"
        />
        <KpiCard
          label={totalBudget > 0 ? 'Budget left' : 'Budget'} icon={<PiggyBank size={14} />}
          value={loading ? '—' : totalBudget > 0 ? fmt(Math.max(0, remaining ?? 0)) : 'Not set'}
          sub={budgetPct != null ? `${budgetPct.toFixed(0)}% used of ${fmt(totalBudget)}` : 'Set budgets in Categories'}
          color={budgetPct != null && budgetPct > 90 ? '#f87171' : 'var(--accent-primary)'}
          glow="rgba(16,185,129,0.12)"
          alert={budgetPct != null && budgetPct > 100}
        />
        <KpiCard
          label="Categories" icon={<LayoutGrid size={14} />}
          value={String(categories.length)}
          sub={categories.filter((c) => c.budget).length > 0
            ? `${categories.filter((c) => c.budget).length} with budgets`
            : 'No budgets set'}
          color="var(--indigo)" glow="rgba(99,102,241,0.12)"
        />
      </div>

      {/* ── Tab bar + month nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        {/* Month nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '5px 10px',
        }}>
          <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', minWidth: 130, textAlign: 'center' }}>
            {fmtMonthLabel(monthKey)}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth} style={{ ...navBtnStyle, opacity: isCurrentMonth ? 0.3 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: 4,
          background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 12,
        }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: tab === t ? 'var(--bg-elevated)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 0.15s',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >

          {/* ── Overview ── */}
          {tab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Spending chart — full width, hero chart */}
                <DashCard title="Daily Spending" subtitle={`${fmtMonthLabel(monthKey)} · gradient bars = daily, line = running total`}>
                  {loading ? <PulseSkeleton h={260} /> : (
                    <SpendingChart expenses={expenses} monthKey={monthKey} />
                  )}
                </DashCard>

                {/* Category donut + Weekday pattern side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DashCard title="Category Breakdown" subtitle="Hover slices to explore">
                    {loading ? <PulseSkeleton h={200} /> : (
                      <CategoryDonut expenses={expenses} categories={categories} />
                    )}
                  </DashCard>
                  <DashCard title="Spending by Weekday" subtitle="Average spend per day of week">
                    {loading ? <PulseSkeleton h={200} /> : (
                      <WeekdaySpend expenses={expenses} />
                    )}
                  </DashCard>
                </div>

                {/* Spending heatmap */}
                <DashCard title="Spending Heatmap" subtitle="Each cell = one day · darker = more spent">
                  {loading ? <PulseSkeleton h={160} /> : (
                    <SpendingHeatmap expenses={expenses} monthKey={monthKey} />
                  )}
                </DashCard>
              </div>

              {/* Right sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

                {/* Budget ring */}
                <DashCard title="Budget Tracker" subtitle="Total across all categories">
                  <BudgetRingDetailed
                    spent={total}
                    categories={categories}
                    spentByCategory={spentByCategory}
                  />
                </DashCard>

                {/* Top expenses */}
                <DashCard title="Biggest Expenses" subtitle="This month">
                  {loading ? <PulseSkeleton h={180} /> : (
                    <TopExpenses expenses={expenses} categories={categories} limit={5} />
                  )}
                </DashCard>
              </div>
            </div>
          )}

          {/* ── Trends ── */}
          {tab === 'Trends' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <DashCard title="6-Month Trend" subtitle="Month-over-month spending" style={{ gridColumn: '1 / -1' }}>
                {trendExpenses.length === 0
                  ? <PulseSkeleton h={200} />
                  : <MonthTrend expensesByMonth={monthlyTrend} />
                }
              </DashCard>

              <DashCard title="Category Breakdown" subtitle={fmtMonthLabel(monthKey)}>
                {loading ? <PulseSkeleton h={220} /> : (
                  <CategoryDonut expenses={expenses} categories={categories} />
                )}
              </DashCard>

              <DashCard title="Weekday Patterns" subtitle="Across all months">
                <WeekdaySpend expenses={trendExpenses.length > 0 ? trendExpenses : expenses} />
              </DashCard>

              <DashCard title="Spending Heatmap" subtitle={fmtMonthLabel(monthKey)} style={{ gridColumn: '1 / -1' }}>
                {loading ? <PulseSkeleton h={160} /> : (
                  <SpendingHeatmap expenses={expenses} monthKey={monthKey} />
                )}
              </DashCard>
            </div>
          )}

          {/* ── Transactions ── */}
          {tab === 'Transactions' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
              <div>
                {loading ? <PulseSkeleton h={300} /> : (
                  <ExpenseList
                    expenses={expenses}
                    categories={categories}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
              <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DashCard title="Top Expenses" subtitle="This month">
                  <TopExpenses expenses={expenses} categories={categories} limit={8} />
                </DashCard>
                <DashCard title="Category Split" subtitle="This month">
                  <CategoryDonut expenses={expenses} categories={categories} />
                </DashCard>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Modals ── */}
      <ExpenseForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        onSave={handleSave}
        categories={categories}
        expense={editingExpense}
      />
      <CategoryManager
        open={catManagerOpen}
        onClose={() => setCatManagerOpen(false)}
        categories={categories}
        onCreate={handleCatCreate}
        onUpdate={handleCatUpdate}
        onDelete={handleCatDelete}
      />
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function DashCard({
  title, subtitle, children, style,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 18,
      padding: '20px 22px',
      ...style,
    }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ label, icon, value, sub, color, glow, alert }: {
  label: string; icon: React.ReactNode; value: string;
  sub?: string; color: string; glow: string; alert?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--bg-glass)', border: `1px solid ${alert ? 'rgba(239,68,68,0.35)' : 'var(--border-subtle)'}`,
      borderRadius: 16, padding: '16px 18px',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -24, right: -24, width: 80, height: 80,
        borderRadius: '50%', background: glow, filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ color, opacity: 0.85 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {alert && (
          <span style={{
            marginLeft: 'auto', fontSize: 9, fontWeight: 700,
            color: '#f87171', background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 99, padding: '1px 7px',
          }}>OVER</span>
        )}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 900, color: alert ? '#f87171' : 'var(--text-primary)',
        letterSpacing: '-0.03em', fontFamily: "'IBM Plex Mono'", lineHeight: 1,
        marginBottom: 6,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

function PulseSkeleton({ h }: { h: number }) {
  return (
    <div style={{
      height: h, borderRadius: 10,
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-glass) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

// ─── style constants ─────────────────────────────────────────────────────────

const primaryBtnStyle: React.CSSProperties = {
  height: 40, padding: '0 18px', borderRadius: 11,
  background: 'var(--accent-primary)', border: 'none',
  color: '#fff', fontSize: 13, fontWeight: 700,
  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
  boxShadow: '0 0 20px rgba(16,185,129,0.3)',
};

const outlineBtnStyle: React.CSSProperties = {
  height: 40, padding: '0 14px', borderRadius: 11,
  background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
};

const navBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
