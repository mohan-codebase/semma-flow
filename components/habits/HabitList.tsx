'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Ban, Target } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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

export default function HabitList({
  habits: initialHabits,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  loading,
  onAddHabit,
}: HabitListProps) {
  const [localHabits, setLocalHabits] = useState<HabitWithEntry[]>(initialHabits);

  useEffect(() => {
    setLocalHabits(initialHabits);
  }, [initialHabits]);

  const goodHabits = useMemo(() => localHabits.filter((h) => !h.is_bad_habit), [localHabits]);
  const badHabits = useMemo(() => localHabits.filter((h) => h.is_bad_habit), [localHabits]);

  const pending = useMemo(
    () => goodHabits.filter((h) => !(h.todayEntry?.is_completed ?? false)),
    [goodHabits]
  );
  const completed = useMemo(
    () => goodHabits.filter((h) => h.todayEntry?.is_completed ?? false),
    [goodHabits]
  );
  const badPending = useMemo(
    () => badHabits.filter((h) => !(h.todayEntry?.is_completed ?? false)),
    [badHabits]
  );
  const badAvoided = useMemo(
    () => badHabits.filter((h) => h.todayEntry?.is_completed ?? false),
    [badHabits]
  );

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const newPending = Array.from(pending);
    const [moved] = newPending.splice(result.source.index, 1);
    newPending.splice(result.destination.index, 0, moved);

    // Preserve completed habits' relative order from the original list. The
    // previous implementation appended `completed` at the end of every save,
    // silently rewriting their sort_order on every drag.
    const reorderedIds = new Set(newPending.map((h) => h.id));
    const stableTail = localHabits.filter((h) => !reorderedIds.has(h.id));
    const newAll = [...newPending, ...stableTail];

    setLocalHabits(newAll);

    try {
      const res = await fetch('/api/habits/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitIds: newAll.map((h) => h.id) }),
      });
      if (!res.ok) {
        // Roll back optimistic order on server rejection
        setLocalHabits(initialHabits);
      }
    } catch {
      setLocalHabits(initialHabits);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (localHabits.length === 0) {
    return <EmptyStateWrapper onAdd={onAddHabit} />;
  }

  const hasBadHabits = badHabits.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Pending habits (Draggable) */}
      {pending.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="pending-habits">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
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
                {pending.map((habit, index) => (
                  <Draggable key={habit.id} draggableId={habit.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          ...dragProvided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.9 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            {...dragProvided.dragHandleProps}
                            style={{
                              color: 'var(--text-muted)',
                              cursor: 'grab',
                              padding: '0 2px',
                              opacity: 0.5,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                          >
                            <GripVertical size={16} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <HabitCard
                              habit={habit}
                              onToggle={onToggle}
                              onEdit={onEdit}
                              onArchive={onArchive}
                              onDelete={onDelete}
                            />
                          </div>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Completed habits (Static, no reorder for completed to avoid confusion) */}
      {completed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionDivider label={`Completed · ${completed.length}`} color="var(--border-subtle)" textColor="var(--text-muted)" />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Completed habits">
            {completed.map((habit) => (
              <li key={habit.id}>
                <HabitCard habit={habit} onToggle={onToggle} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bad habits section */}
      {hasBadHabits && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Red divider with label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(104, 104, 104,0.25)' }} />
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: '#8e8e8e',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <Ban size={11} />
              Bad Habits · {badAvoided.length}/{badHabits.length} avoided
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(104, 104, 104,0.25)' }} />
          </div>

          {/* Not yet avoided today */}
          {badPending.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Bad habits not yet avoided">
              {badPending.map((habit) => (
                <li key={habit.id}>
                  <HabitCard habit={habit} onToggle={onToggle} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
                </li>
              ))}
            </ul>
          )}

          {/* Avoided today */}
          {badAvoided.length > 0 && (
            <>
              {badPending.length > 0 && (
                <SectionDivider label={`Avoided · ${badAvoided.length}`} color="rgba(104, 104, 104,0.3)" textColor="#8e8e8e" />
              )}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Avoided bad habits">
                {badAvoided.map((habit) => (
                  <li key={habit.id}>
                    <HabitCard habit={habit} onToggle={onToggle} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionDivider({ label, color = 'var(--border-subtle)', textColor = 'var(--text-muted)' }: { label: string; color?: string; textColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: color }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: textColor, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: color }} />
    </div>
  );
}

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
        <Skeleton variant="text" />
        <div style={{ width: '60%' }}>
          <Skeleton variant="text" />
        </div>
      </div>
      <Skeleton variant="circle" />
    </div>
  );
}

function EmptyStateWrapper({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Target size={34} color="var(--accent-primary)" />}
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
