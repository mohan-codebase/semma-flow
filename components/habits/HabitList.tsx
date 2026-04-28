'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { HabitWithEntry } from '@/types/habit';
import HabitCard from '@/components/habits/HabitCard';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

interface HabitListProps {
  habits: HabitWithEntry[];
  onToggle: (habitId: string, completed: boolean) => void;
  onEdit: (habit: HabitWithEntry) => void;
  onArchive: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  loading: boolean;
  onAddHabit?: () => void;
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.95,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

function SkeletonCard() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '12px 16px',
      }}
    >
      <Skeleton variant="circle" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton variant="text" className="" />
        <div style={{ width: '60%' }}>
          <Skeleton variant="text" className="" />
        </div>
      </div>
      <Skeleton variant="circle" />
    </div>
  );
}

function EmptyStateWrapper({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      emoji="🎯"
      title="No habits yet"
      description="Your journey starts with one habit. Add something small — consistency beats intensity every time."
      accentColor="var(--accent-primary)"
      cta={
        onAdd ? (
          <Button variant="primary" icon={<Plus size={15} />} onClick={onAdd}>
            Add your first habit
          </Button>
        ) : undefined
      }
      hint="You can track health, fitness, learning, mindfulness, and more."
    />
  );
}

export default function HabitList({
  habits,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  loading,
  onAddHabit,
}: HabitListProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return <EmptyStateWrapper onAdd={onAddHabit} />;
  }

  const pending = React.useMemo(
    () => habits.filter((h) => !(h.todayEntry?.is_completed ?? false)),
    [habits]
  );
  const completed = React.useMemo(
    () => habits.filter((h) => h.todayEntry?.is_completed ?? false),
    [habits]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Pending habits */}
      {pending.length > 0 && (
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="visible"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          aria-label="Pending habits"
        >
          <AnimatePresence mode="popLayout">
            {pending.map((habit) => (
              <motion.li
                key={habit.id}
                variants={itemVariants}
                exit="exit"
                layout
              >
                <HabitCard
                  habit={habit}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {/* Completed divider + section */}
      {completed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Completed · {completed.length}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <motion.ul
            variants={listVariants}
            initial="hidden"
            animate="visible"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            aria-label="Completed habits"
          >
            <AnimatePresence mode="popLayout">
              {completed.map((habit) => (
                <motion.li
                  key={habit.id}
                  variants={itemVariants}
                  exit="exit"
                >
                  <HabitCard
                    habit={habit}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onArchive={onArchive}
                    onDelete={onDelete}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      )}
    </div>
  );
}
