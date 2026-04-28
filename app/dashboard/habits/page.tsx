'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, List } from 'lucide-react';
import type { HabitWithEntry, Habit, Category } from '@/types/habit';
import HabitCard from '@/components/habits/HabitCard';
import HabitForm from '@/components/habits/HabitForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { todayString } from '@/lib/utils/dates';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

type FilterTab = 'all' | 'active' | 'archived';
type ViewMode = 'grid' | 'list';

// -----------------------------------------------------------------------
// Skeleton grid card
// -----------------------------------------------------------------------

function HabitSkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Skeleton variant="circle" />
        <div style={{ flex: 1 }}>
          <Skeleton variant="text" />
        </div>
      </div>
      <Skeleton variant="text" />
      <div style={{ width: '50%' }}>
        <Skeleton variant="text" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Empty state
// -----------------------------------------------------------------------

function PageEmptyState({
  filter,
  onAdd,
}: {
  filter: FilterTab;
  onAdd: () => void;
}) {
  const CONFIGS: Record<FilterTab, { emoji: string; title: string; body: string; accent: string; showCta: boolean }> = {
    all: {
      emoji: '🎯',
      title: 'No habits yet',
      body: "You haven't built your routine yet. Add your first habit and start stacking wins — one day at a time.",
      accent: 'var(--accent-primary)',
      showCta: true,
    },
    active: {
      emoji: '⚡',
      title: 'No active habits',
      body: 'All your habits are archived, or you haven\'t created any yet. Add one to get started.',
      accent: 'var(--accent-primary)',
      showCta: true,
    },
    archived: {
      emoji: '🗂️',
      title: 'Nothing archived',
      body: "You haven't archived any habits. Archived habits are kept for your records but removed from your daily list.",
      accent: 'var(--text-muted)',
      showCta: false,
    },
  };

  const { emoji, title, body, accent, showCta } = CONFIGS[filter];

  return (
    <EmptyState
      emoji={emoji}
      title={title}
      description={body}
      accentColor={accent}
      cta={
        showCta ? (
          <Button variant="primary" icon={<Plus size={15} />} onClick={onAdd}>
            New Habit
          </Button>
        ) : undefined
      }
    />
  );
}

// -----------------------------------------------------------------------
// Filter tab button
// -----------------------------------------------------------------------

function TabButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '9999px',
        border: active ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border-subtle)',
        background: active ? 'var(--accent-glow)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '1px 6px',
          borderRadius: '9999px',
          background: active ? 'rgba(16,185,129,0.2)' : 'var(--bg-tertiary)',
          color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
          minWidth: '18px',
          textAlign: 'center',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// -----------------------------------------------------------------------
// View toggle button
// -----------------------------------------------------------------------

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '3px',
        gap: '2px',
      }}
    >
      {(['grid', 'list'] as ViewMode[]).map((v) => {
        const active = view === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-label={`${v} view`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              border: 'none',
              background: active ? 'var(--bg-secondary)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {v === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------

export default function HabitsPage() {
  const { toast } = useToast();
  const [activeHabits, setActiveHabits] = useState<HabitWithEntry[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<HabitWithEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterTab>('all');
  const [view, setView] = useState<ViewMode>('grid');

  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch habits
  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, archivedRes, catRes] = await Promise.all([
        fetch('/api/habits'),
        fetch('/api/habits?archived=true'),
        fetch('/api/categories'),
      ]);

      if (activeRes.ok) {
        const json = await activeRes.json();
        setActiveHabits(json.data || []);
      }
      if (archivedRes.ok) {
        const json = await archivedRes.json();
        setArchivedHabits(json.data || []);
      }
      if (catRes.ok) {
        const json = await catRes.json();
        setCategories(json.data || []);
      }
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHabits();
  }, [fetchHabits]);

  // Derive visible habits based on filter
  const visibleHabits: HabitWithEntry[] =
    filter === 'all'
      ? activeHabits
      : filter === 'active'
      ? activeHabits.filter((h) => !h.is_archived)
      : archivedHabits;

  const handleToggle = useCallback(async (habitId: string, completed: boolean) => {
    const today = todayString();
    const now = new Date().toISOString();
    
    const targetHabit = activeHabits.find((h) => h.id === habitId);
    if (!targetHabit) return;
    const snapshotEntry = targetHabit.todayEntry ?? null;

    setActiveHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              todayEntry: h.todayEntry
                ? { ...h.todayEntry, is_completed: completed }
                : {
                    id: `optimistic-${habitId}`,
                    habit_id: habitId,
                    user_id: '',
                    entry_date: today,
                    is_completed: completed,
                    value: null,
                    notes: null,
                    completed_at: completed ? now : null,
                    created_at: now,
                    updated_at: now,
                  },
            }
          : h
      )
    );

    try {
      const res = await fetch('/api/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, entry_date: today, is_completed: completed }),
      });

      if (!res.ok) throw new Error('Failed to save');

      const json = await res.json();
      setActiveHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, todayEntry: json.data } : h
        )
      );
    } catch {
      setActiveHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, todayEntry: snapshotEntry } : h
        )
      );
      toast('Failed to save. Try again.', 'error');
    }
  }, [activeHabits, toast]);

  const handleArchive = useCallback(async (habitId: string) => {
    setActiveHabits((prev) => prev.filter((h) => h.id !== habitId));
    const habit = activeHabits.find((h) => h.id === habitId);
    if (habit) {
      setArchivedHabits((prev) => [...prev, { ...habit, is_archived: true }]);
    }
    await fetch(`/api/habits/${habitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: true }),
    });
  }, [activeHabits]);

  const handleEdit = useCallback((habit: HabitWithEntry) => {
    setEditingHabit(habit);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((habitId: string) => {
    setDeleteTarget(habitId);
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/habits/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveHabits((prev) => prev.filter((h) => h.id !== deleteTarget));
        setArchivedHabits((prev) => prev.filter((h) => h.id !== deleteTarget));
      }
    } catch {
      /* silently ignore */
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleFormSuccess = (saved: Habit) => {
    setActiveHabits((prev) => {
      const exists = prev.some((h) => h.id === saved.id);
      if (exists) {
        return prev.map((h) => (h.id === saved.id ? { ...h, ...saved } : h));
      }
      return [...prev, { ...saved, todayEntry: null, completionRate: 0 }];
    });
    setFormOpen(false);
    setEditingHabit(null);
  };

  const openNewHabitForm = () => {
    setEditingHabit(null);
    setFormOpen(true);
  };

  const deleteHabitName = [...(activeHabits || []), ...(archivedHabits || [])].find(
    (h) => h.id === deleteTarget
  )?.name;

  const gridStyle: React.CSSProperties =
    view === 'grid'
      ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px',
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.18 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' as const }}
      className="hf-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          My Habits
        </h1>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={openNewHabitForm}
        >
          New Habit
        </Button>
      </div>

      {/* Controls bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <TabButton
            label="All"
            count={activeHabits.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <TabButton
            label="Active"
            count={activeHabits.filter((h) => !h.is_archived).length}
            active={filter === 'active'}
            onClick={() => setFilter('active')}
          />
          <TabButton
            label="Archived"
            count={archivedHabits.length}
            active={filter === 'archived'}
            onClick={() => setFilter('archived')}
          />
        </div>

        {/* View toggle */}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Habit grid / list */}
      {loading ? (
        <div style={gridStyle}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <HabitSkeletonCard key={i} />
          ))}
        </div>
      ) : visibleHabits.length === 0 ? (
        <div style={gridStyle}>
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <PageEmptyState filter={filter} onAdd={openNewHabitForm} />
          </div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={gridStyle}
        >
          <AnimatePresence mode="popLayout">
            {visibleHabits.map((habit) => (
              <motion.div
                key={habit.id}
                variants={itemVariants}
                exit="exit"
                layout
              >
                <HabitCard
                  habit={habit}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB (mobile) */}
      <motion.button
        type="button"
        onClick={openNewHabitForm}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Add new habit"
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: '80px', // above mobile nav
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          border: 'none',
          boxShadow: '0 4px 20px var(--accent-glow), 0 0 0 1px rgba(16,185,129,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 30,
          color: '#0A0A0F',
        }}
      >
        <Plus size={22} />
      </motion.button>

      {/* HabitForm modal */}
      {formOpen && (
        <HabitForm
          habit={editingHabit ?? undefined}
          categories={categories}
          onSuccess={handleFormSuccess}
          onClose={() => {
            setFormOpen(false);
            setEditingHabit(null);
          }}
        />
      )}

      {/* Delete confirm modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Habit"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{deleteHabitName}</strong>?
            This will permanently remove all its history and cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteLoading} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
