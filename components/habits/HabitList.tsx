'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical } from 'lucide-react';
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

  const pending = useMemo(
    () => localHabits.filter((h) => !(h.todayEntry?.is_completed ?? false)),
    [localHabits]
  );
  const completed = useMemo(
    () => localHabits.filter((h) => h.todayEntry?.is_completed ?? false),
    [localHabits]
  );

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    // We only reorder the 'pending' list for now to keep logic simple
    const newPending = Array.from(pending);
    const [reordered] = newPending.splice(result.source.index, 1);
    newPending.splice(result.destination.index, 0, reordered);

    // Merge back with completed
    const newAll = [...newPending, ...completed];
    setLocalHabits(newAll);

    // Persist to server
    try {
      await fetch('/api/habits/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitIds: newAll.map(h => h.id) }),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Completed · {completed.length}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <ul
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
            {completed.map((habit) => (
              <li key={habit.id}>
                <HabitCard
                  habit={habit}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
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
