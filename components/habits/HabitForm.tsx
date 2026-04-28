'use client';

import React, { useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import IconPicker from '@/components/ui/IconPicker';
import { habitSchema, type HabitFormValues } from '@/lib/validations/habit';
import type { Habit, Category } from '@/types/habit';

interface HabitFormProps {
  habit?: Habit;
  categories: Category[];
  categoryError?: boolean;
  onRetryCategories?: () => void;
  onSuccess: (habit: Habit) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F59E0B', '#EF4444', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1',
];

type FrequencyTab = 'daily' | 'weekly' | 'x_per_week' | 'x_per_month';
type TargetTab = 'boolean' | 'numeric' | 'duration';

const FREQUENCY_LABELS: Record<FrequencyTab, string> = {
  daily: 'Daily',
  weekly: 'Specific Days',
  x_per_week: 'Per Week',
  x_per_month: 'Per Month',
};

const TARGET_LABELS: Record<TargetTab, string> = {
  boolean: 'Check-off',
  numeric: 'Numeric',
  duration: 'Duration',
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return `rgba(16,185,129,${alpha})`;
  const s = hex.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

interface SegmentedControlProps<T extends string> {
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}

function SegmentedControl<T extends string>({
  options,
  labels,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--bg-tertiary)',
        borderRadius: 10,
        padding: 3,
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '6px 10px',
              borderRadius: 7,
              border: 'none',
              background: active ? 'var(--bg-secondary)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}

export default function HabitForm({ habit, categories, categoryError, onRetryCategories, onSuccess, onClose }: HabitFormProps) {
  const isEdit = !!habit;
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema) as Resolver<HabitFormValues>,
    defaultValues: habit
      ? {
          name: habit.name,
          description: habit.description ?? undefined,
          icon: habit.icon,
          color: habit.color,
          category_id: habit.category_id ?? null,
          frequency: habit.frequency,
          target_type: habit.target_type,
          target_value: habit.target_value,
          target_unit: habit.target_unit ?? null,
          reminder_time: habit.reminder_time ?? null,
        }
      : {
          name: '',
          icon: 'circle-check',
          color: '#10B981',
          frequency: { type: 'daily' },
          target_type: 'boolean',
          target_value: 1,
        },
  });

  const watchColor = watch('color');
  const watchFrequencyType = watch('frequency.type');
  const watchFrequencyDays = watch('frequency.days') ?? [];
  const watchTargetType = watch('target_type');
  const watchDescription = watch('description') ?? '';

  const toggleDay = (day: number) => {
    const current = watchFrequencyDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    setValue('frequency.days', next);
  };

  const onSubmit = async (values: HabitFormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const url = isEdit ? `/api/habits/${habit.id}` : '/api/habits';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Something went wrong');
      }

      onSuccess(json.data);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: `1px solid ${errors.description ? 'var(--danger)' : 'var(--border-subtle)'}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    resize: 'vertical',
    outline: 'none',
    minHeight: 72,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Habit' : 'New Habit'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Name */}
          <Input
            label="Name"
            required
            placeholder="e.g. Morning Run"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Description */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Description
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
                (optional)
              </span>
            </label>
            <textarea
              {...register('description')}
              placeholder="What's this habit about?"
              style={textareaStyle}
              maxLength={500}
              onFocus={(e) => { e.target.style.borderColor = 'var(--border-active)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
              {watchDescription.length} / 500
            </span>
            {errors.description && (
              <span style={{ fontSize: 12, color: 'var(--danger)' }}>
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Color + Icon row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Color picker */}
            <div style={{ ...fieldStyle, flex: 2, minWidth: 180 }}>
              <label style={labelStyle}>Color</label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {PRESET_COLORS.map((c) => {
                      const selected = field.value === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => field.onChange(c)}
                          aria-label={`Color ${c}`}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: c,
                            border: selected
                              ? `2px solid white`
                              : '2px solid transparent',
                            boxShadow: selected
                              ? `0 0 0 2px ${c}, 0 0 10px ${hexToRgba(c, 0.5)}`
                              : 'none',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.15s ease, transform 0.12s ease',
                            transform: selected ? 'scale(1.15)' : 'scale(1)',
                          }}
                        />
                      );
                    })}
                    {/* Custom hex input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: watchColor,
                          border: '1px solid var(--border-subtle)',
                          flexShrink: 0,
                        }}
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#10B981"
                        style={{
                          width: 90,
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 8,
                          padding: '4px 8px',
                          fontSize: 12,
                          fontFamily: "'IBM Plex Mono', monospace",
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Icon */}
            <div style={{ ...fieldStyle, flex: 1.5, minWidth: 260 }}>
              <label style={labelStyle}>Icon</label>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <IconPicker
                    value={field.value}
                    onChange={field.onChange}
                    color={watchColor}
                  />
                )}
              />
              {errors.icon && (
                <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                  {errors.icon.message}
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Category</label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    color: field.value ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 14,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__new__">+ Create new category</option>
                </select>
              )}
            />
            {categoryError && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--danger)' }}>
                <span>Couldn't load categories.</span>
                {onRetryCategories && (
                  <button
                    type="button"
                    onClick={onRetryCategories}
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Frequency */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Frequency</label>
            <Controller
              name="frequency.type"
              control={control}
              render={({ field }) => (
                <SegmentedControl<FrequencyTab>
                  options={['daily', 'weekly', 'x_per_week', 'x_per_month']}
                  labels={FREQUENCY_LABELS}
                  value={field.value as FrequencyTab}
                  onChange={(v) => {
                    field.onChange(v);
                    // Reset sub-fields and any validation errors from previous tab
                    setValue('frequency.days', []);
                    setValue('frequency.count', undefined);
                    clearErrors('frequency');
                  }}
                />
              )}
            />

            {/* Specific Days toggles */}
            {watchFrequencyType === 'weekly' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
                {DAY_LABELS.map((label, idx) => {
                  const active = watchFrequencyDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-label={DAY_FULL_LABELS[idx]}
                      aria-pressed={active}
                      onClick={() => toggleDay(idx)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        background: active ? 'var(--accent-primary)' : 'transparent',
                        color: active ? 'var(--accent-on-primary)' : 'var(--text-secondary)',
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Per Week / Per Month count */}
            {(watchFrequencyType === 'x_per_week' || watchFrequencyType === 'x_per_month') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <Input
                  type="number"
                  placeholder="3"
                  error={errors.frequency?.count?.message}
                  {...register('frequency.count', { valueAsNumber: true })}
                />
                <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  times {watchFrequencyType === 'x_per_week' ? 'per week' : 'per month'}
                </span>
              </div>
            )}
          </div>

          {/* Target */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Target type</label>
            <Controller
              name="target_type"
              control={control}
              render={({ field }) => (
                <SegmentedControl<TargetTab>
                  options={['boolean', 'numeric', 'duration']}
                  labels={TARGET_LABELS}
                  value={field.value as TargetTab}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue('target_value', 1);
                    setValue('target_unit', null);
                  }}
                />
              )}
            />

            {watchTargetType === 'numeric' && (
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <Input
                  type="number"
                  placeholder="8"
                  label="Amount"
                  error={errors.target_value?.message}
                  {...register('target_value', { valueAsNumber: true })}
                />
                <Input
                  placeholder="glasses, pages..."
                  label="Unit"
                  error={errors.target_unit?.message}
                  {...register('target_unit')}
                />
              </div>
            )}

            {watchTargetType === 'duration' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <Input
                  type="number"
                  placeholder="30"
                  label="Duration"
                  error={errors.target_value?.message}
                  {...register('target_value', { valueAsNumber: true })}
                />
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 22, whiteSpace: 'nowrap' }}>
                  minutes
                </span>
              </div>
            )}
          </div>

          {/* Reminder time */}
          <Input
            type="time"
            label="Reminder time (optional)"
            error={errors.reminder_time?.message}
            {...register('reminder_time')}
          />

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.25)',
                color: 'var(--danger, #F43F5E)',
                fontSize: 13,
              }}
            >
              {serverError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button
              variant="secondary"
              fullWidth
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              type="submit"
              loading={loading}
            >
              {isEdit ? 'Update Habit' : 'Save Habit'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
