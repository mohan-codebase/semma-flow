'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { goalSchema, type GoalFormValues } from '@/lib/validations/goal';
import type { Goal, GoalCategory } from '@/types/goal';
import { X, Plus, Trash2 } from 'lucide-react';

const CATEGORIES: { value: GoalCategory; label: string; emoji: string }[] = [
  { value: 'health',         label: 'Health',         emoji: '🏥' },
  { value: 'fitness',        label: 'Fitness',        emoji: '💪' },
  { value: 'finance',        label: 'Finance',        emoji: '💰' },
  { value: 'career',         label: 'Career',         emoji: '🚀' },
  { value: 'learning',       label: 'Learning',       emoji: '📚' },
  { value: 'relationships',  label: 'Relationships',  emoji: '❤️' },
  { value: 'mindfulness',    label: 'Mindfulness',    emoji: '🧘' },
  { value: 'personal',       label: 'Personal',       emoji: '⭐' },
];

interface GoalFormProps {
  goal?: Goal | null;
  onSave: (data: GoalFormValues) => Promise<void>;
  onClose: () => void;
  saving?: boolean;
}

export default function GoalForm({ goal, onSave, onClose, saving }: GoalFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as Resolver<GoalFormValues>,
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      target_date: null,
      status: 'active',
      progress: 0,
      milestones: [],
      linked_habit_ids: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({ control, name: 'milestones' });

  useEffect(() => {
    if (goal) {
      reset({
        title: goal.title,
        description: goal.description ?? '',
        category: goal.category,
        target_date: goal.target_date ?? null,
        status: goal.status,
        progress: goal.progress,
        milestones: goal.milestones,
        linked_habit_ids: goal.linked_habit_ids,
      });
    } else {
      reset({
        title: '', description: '', category: 'personal',
        target_date: null, status: 'active', progress: 0,
        milestones: [], linked_habit_ids: [],
      });
    }
  }, [goal, reset]);

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%',
        maxWidth: 540, maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid var(--border-default)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {goal ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Goal Title *</label>
            <input {...register('title')} placeholder="What do you want to achieve?" style={inp} />
            {errors.title && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.title.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block', fontWeight: 600 }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((c) => (
                <label key={c.value} style={{ cursor: 'pointer' }}>
                  <input {...register('category')} type="radio" value={c.value} style={{ display: 'none' }} />
                  <div style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none',
                  }}>
                    {c.emoji} {c.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Description</label>
            <textarea
              {...register('description')}
              placeholder="Why does this goal matter to you?"
              rows={2}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Target date + status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Target Date</label>
              <input type="date" {...register('target_date')} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Status</label>
              <select {...register('status')} style={inp}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
          </div>

          {/* Progress */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>
              Progress
            </label>
            <input
              type="range" min={0} max={100} step={5}
              {...register('progress', { valueAsNumber: true })}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          {/* Milestones */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Milestones</label>
              <button
                type="button"
                onClick={() => append({ id: crypto.randomUUID(), title: '', completed: false, completed_at: null })}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Plus size={12} /> Add milestone
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((field, i) => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={field.completed}
                    onChange={(e) => update(i, { ...field, completed: e.target.checked, completed_at: e.target.checked ? new Date().toISOString() : null })}
                    style={{ accentColor: 'var(--accent-primary)', flexShrink: 0 }}
                  />
                  <input
                    {...register(`milestones.${i}.title`)}
                    placeholder={`Milestone ${i + 1}`}
                    style={{ ...inp, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : goal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
