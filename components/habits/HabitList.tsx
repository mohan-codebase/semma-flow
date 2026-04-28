'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import type { HabitWithEntry } from '@/types/habit';
import HabitCard from '@/components/habits/HabitCard';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

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

function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'var(--accent-glow)',
          border: '1px solid rgba(16,185,129,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 32px var(--accent-glow)',
        }}
      >
        <Sparkles size={32} color="var(--accent-primary)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          No habits yet
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--text-muted)',
            maxWidth: 260,
            lineHeight: 1.6,
          }}
        >
          Start building positive routines. Add your first habit to begin tracking your progress.
        </p>
      </div>

      {onAdd && (
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={onAdd}
        >
          Add your first habit
        </Button>
      )}
    </motion.div>
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
    return <EmptyState onAdd={onAddHabit} />;
  }

  const pending = habits.filter((h) => !(h.todayEntry?.is_completed ?? false));
  const completed = habits.filter((h) => h.todayEntry?.is_completed ?? false);

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
