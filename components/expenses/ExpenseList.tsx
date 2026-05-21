'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/types/expense';

interface ExpenseListProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ExpenseList({ expenses, categories, onEdit, onDelete }: ExpenseListProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [expenses]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (expenses.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', textAlign: 'center',
        background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 16,
      }}>
        <span style={{ fontSize: 36, marginBottom: 12 }}>💸</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No expenses yet</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add your first expense to start tracking</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {grouped.map(([date, dayExpenses]) => {
        const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
        const isExpanded = expandedDates.has(date);

        return (
          <div
            key={date}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Day header */}
            <button
              onClick={() => toggleDate(date)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {fmtDate(date)}
                </span>
                <span style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  background: 'var(--bg-elevated)',
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  {dayExpenses.length} item{dayExpenses.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {fmt(dayTotal)}
                </span>
                {isExpanded
                  ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
              </div>
            </button>

            {/* Day items */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '8px 0' }}>
                    {dayExpenses.map((expense, i) => {
                      const cat = categories.find((c) => c.id === expense.category_id);
                      return (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          category={cat ?? null}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          isLast={i === dayExpenses.length - 1}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed preview — show first 2 items */}
            {!isExpanded && (
              <div style={{ padding: '4px 0 8px' }}>
                {dayExpenses.slice(0, 2).map((expense, i) => {
                  const cat = categories.find((c) => c.id === expense.category_id);
                  return (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      category={cat ?? null}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isLast={i === Math.min(1, dayExpenses.length - 1)}
                      compact
                    />
                  );
                })}
                {dayExpenses.length > 2 && (
                  <button
                    onClick={() => toggleDate(date)}
                    style={{
                      width: '100%', padding: '6px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600,
                      textAlign: 'left',
                    }}
                  >
                    +{dayExpenses.length - 2} more
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExpenseRow({
  expense, category, onEdit, onDelete, isLast, compact,
}: {
  expense: Expense;
  category: ExpenseCategory | null;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  isLast: boolean;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: compact ? '8px 16px' : '10px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        transition: 'background 0.15s',
        background: hovered ? 'var(--bg-elevated)' : 'transparent',
      }}
    >
      {/* Category dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: category?.color ?? 'var(--text-muted)',
        flexShrink: 0,
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {expense.description}
        </div>
        {!compact && expense.note && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{expense.note}</div>
        )}
        {category && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{category.name}</div>
        )}
      </div>

      {/* Amount */}
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
        {fmt(expense.amount)}
      </span>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
      }}>
        <IconBtn onClick={() => onEdit(expense)} title="Edit">
          <Pencil size={12} />
        </IconBtn>
        <IconBtn onClick={() => onDelete(expense.id)} title="Delete" danger>
          <Trash2 size={12} />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children, onClick, title, danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26, height: 26, borderRadius: 6,
        background: danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: danger ? '#f87171' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
