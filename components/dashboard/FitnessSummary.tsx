'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus } from 'lucide-react';
import { DynamicIcon, HABIT_ICON_NAMES } from '@/lib/icons';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import WeeklyReportChart from '@/components/dashboard/WeeklyReportChart';
import type { OverviewStats } from '@/types/analytics';
import type { HabitWithEntry, Habit } from '@/types/habit';
import { todayString } from '@/lib/utils/dates';

interface FitnessSummaryProps {
  stats: OverviewStats | null;
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  displayName?: string;
  initials?: string;
  email?: string;
  onBackToHub?: () => void;
}

const PURPLE = 'var(--accent-primary)';
const PURPLE_LIGHT = 'var(--surface-tint)';
const PURPLE_MID = 'var(--surface-tint-mid)';
const TEXT_DARK = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
// Raw hex needed only for SVG attributes and rgba() calls
const PURPLE_HEX = '#7C3AED';

// Bad-habit theming — red accents, kept consistent with HabitCard/HabitList
const RED = '#EF4444';
const RED_SOFT = '#f87171';
const RED_LIGHT = 'rgba(239,68,68,0.12)';

// Liquid glass helpers (inline style objects)
const GLASS: React.CSSProperties = {
  background: 'var(--glass-bg)',
  boxShadow: 'var(--glass-shadow)',
};
const GLASS_SM: React.CSSProperties = {
  background: 'var(--glass-bg)',
  boxShadow: 'var(--glass-shadow-sm)',
};
const GLASS_PURPLE: React.CSSProperties = {
  background: 'var(--glass-bg-purple)',
  boxShadow: 'var(--glass-shadow-purple)',
};
const GLASS_NESTED: React.CSSProperties = {
  background: 'var(--glass-bg)',
  boxShadow: 'var(--glass-shadow-sm)',
};
const GLASS_NESTED_PURPLE: React.CSSProperties = {
  background: 'var(--glass-bg-purple)',
  boxShadow: 'var(--glass-shadow-purple)',
};

const RADIUS = 100;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const size = (RADIUS + STROKE) * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      style={{
        marginTop: 24,
        padding: '24px 20px 28px',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        background: 'rgba(124,58,237,0.05)',
        border: '1px solid rgba(124,58,237,0.10)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Today&apos;s Progress
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.03em' }}>
            {completed} of {total} done
          </p>
        </div>
        <div style={{
          padding: '6px 14px',
          borderRadius: 20,
          background: 'rgba(124,58,237,0.10)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: PURPLE }}>{pct}%</span>
        </div>
      </div>

      {/* Ring */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(124,58,237,0.10)"
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={RADIUS}
            fill="none"
            stroke={PURPLE_HEX}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </svg>
        {/* Centre label */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {pct}%
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED, letterSpacing: '0.03em' }}>
            complete
          </span>
        </div>
      </div>

      {/* Per-habit dots */}
      {total > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%', marginTop: 28 }}>
          {Array.from({ length: total }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: 0.6 + i * 0.05 }}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: i < completed ? PURPLE_HEX : 'transparent',
                border: `2px solid ${i < completed ? PURPLE_HEX : 'rgba(124,58,237,0.25)'}`,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 9.5L7.5 13L14 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HabitRow({
  habit,
  index,
  onToggle,
  onOpen,
  bad = false,
}: {
  habit: HabitWithEntry;
  index: number;
  onToggle: (id: string, completed: boolean) => void;
  onOpen: (id: string) => void;
  bad?: boolean;
}) {
  const done = habit.todayEntry?.is_completed ?? false;
  const icon = habit.icon ?? (bad ? 'ban' : 'circle-check');

  // For bad habits, checking the row off means the user *avoided* it today.
  const accent = bad ? RED : (habit.color || PURPLE);
  const accentLight = bad ? RED_LIGHT : `color-mix(in srgb, ${accent} 14%, transparent)`;

  const subtitle = bad
    ? (done ? 'Avoided today' : 'Avoid this')
    : habit.description
      ? habit.description.slice(0, 36) + (habit.description.length > 36 ? '…' : '')
      : habit.frequency?.type === 'daily'
        ? 'Daily habit'
        : 'Habit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        ...(done && !bad ? GLASS_PURPLE : GLASS_SM),
        ...(bad ? { border: `1px solid ${done ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.18)'}` } : null),
        borderRadius: 18,
        cursor: 'pointer',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => onOpen(habit.id)}
    >
      {/* Icon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        background: accentLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        flexGrow: 0,
        overflow: 'hidden',
      }}>
        <DynamicIcon name={icon} size={22} color={accent} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: TEXT_DARK,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {habit.name}
        </p>
        <p style={{
          margin: '2px 0 0',
          fontSize: 12,
          color: TEXT_MUTED,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {subtitle}
        </p>
      </div>

      {/* Checkbox — stopPropagation so it only toggles, doesn't open detail */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggle(habit.id, done); }}
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: done ? accent : 'transparent',
          border: `2px solid ${done ? accent : 'var(--drag-handle)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s ease',
        }}
      >
        {done && <CheckIcon />}
      </div>

      {/* Animated progress bar — fills with the habit's color on completion.
         Lives in the shared row, so every habit (incl. brand-new ones) gets it. */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 4,
        background: 'rgba(127,127,127,0.10)',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: done ? '100%' : '0%' }}
          transition={{ duration: 0.55, delay: 0.1 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', background: accent, borderRadius: '0 2px 2px 0' }}
        />
      </div>
    </motion.div>
  );
}

function StatPill({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  const c = color || PURPLE;
  return (
    <div style={{
      ...(accent ? { ...GLASS_NESTED_PURPLE, background: `color-mix(in srgb, ${c} 14%, transparent)` } : GLASS_NESTED),
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: accent ? c : TEXT_DARK, letterSpacing: '-0.03em' }}>
        {value}
      </p>
    </div>
  );
}

function HabitDetailSheet({
  habit,
  onClose,
  onUpdate,
  onDelete,
}: {
  habit: HabitWithEntry;
  onClose: () => void;
  onUpdate: (updated: Partial<HabitWithEntry> & { id: string }) => void;
  onDelete: (id: string) => void;
}) {
  // ── Theme the whole sheet with this habit's chosen color ──
  // These locals deliberately shadow the module-level purple tokens, so every
  // accent below (stat numbers, calendar, nav, month bar, chart) follows the
  // habit's color. Falls back to brand purple when a habit has none.
  const PURPLE = habit.color || '#7C3AED';
  const PURPLE_HEX = PURPLE;
  const PURPLE_LIGHT = `color-mix(in srgb, ${PURPLE} 14%, transparent)`;
  const PURPLE_MID = `color-mix(in srgb, ${PURPLE} 24%, transparent)`;

  const [entries, setEntries] = useState<{ entry_date: string; is_completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editIcon, setEditIcon] = useState(habit.icon ?? 'circle-check');
  const [editColor, setEditColor] = useState(habit.color || '#7C3AED');
  const [editNotes, setEditNotes] = useState(habit.description ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Backfill: which day is currently being saved (for disabling during the request)
  const [savingDay, setSavingDay] = useState<string | null>(null);

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), icon: editIcon, color: editColor, description: editNotes.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      onUpdate({ id: habit.id, name: editName.trim(), icon: editIcon, color: editColor, description: editNotes.trim() });
      setEditMode(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/habits/${habit.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(habit.id);
        onClose();
      } else {
        setDeleting(false);
      }
    } catch {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/habits/${habit.id}`)
      .then((r) => r.json())
      .then((json) => { setEntries(json.data?.entries ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [habit.id]);

  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = last month …

  const todayDate = new Date();
  const todayLocal = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  const displayDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + monthOffset, 1);
  const calYear = displayDate.getFullYear();
  const calMonth = displayDate.getMonth();

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();

  const entryMap = new Map(entries.map((e) => [e.entry_date, e.is_completed]));

  // Build padded calendar cells
  type CalCell = { date: string; day: number; completed: boolean; isToday: boolean; isFuture: boolean };
  const calCells: (CalCell | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: ds, day, completed: entryMap.get(ds) ?? false, isToday: ds === todayLocal, isFuture: ds > todayLocal };
    }),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  // Tap any past/today cell to backfill (mark/unmark) that day's entry.
  const markDay = async (ds: string, currentlyCompleted: boolean) => {
    if (ds > todayLocal) return;              // never the future
    const next = !currentlyCompleted;
    setSavingDay(ds);
    // optimistic
    setEntries((prev) => [...prev.filter((e) => e.entry_date !== ds), { entry_date: ds, is_completed: next }]);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habit.id, entry_date: ds, is_completed: next }),
      });
      if (!res.ok) throw new Error(`save failed ${res.status}`);
      // keep the main dashboard list in sync when today is changed here
      if (ds === todayLocal) {
        onUpdate({ id: habit.id, todayEntry: { habit_id: habit.id, is_completed: next } as HabitWithEntry['todayEntry'] });
      }
    } catch (e) {
      console.error('[markDay] backfill failed, reverting:', e);
      setEntries((prev) => [...prev.filter((e) => e.entry_date !== ds), { entry_date: ds, is_completed: currentlyCompleted }]);
    } finally {
      setSavingDay(null);
    }
  };

  // Month-level stats for the visible month
  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthEntries = entries.filter((e) => e.entry_date.startsWith(monthPrefix));
  const monthDone = monthEntries.filter((e) => e.is_completed).length;
  const isCurrentMon = calYear === todayDate.getFullYear() && calMonth === todayDate.getMonth();
  const daysElapsed = isCurrentMon ? todayDate.getDate() : daysInMonth;
  const monthRate = daysElapsed > 0 ? Math.round((monthDone / daysElapsed) * 100) : 0;
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed); // days left in the month

  // For stat pills — last 30-day rate
  const completedCount = entries.filter((e) => e.is_completed).length;
  const rate = Math.min(100, Math.round((completedCount / 30) * 100));

  // Per-habit weekly report — last 7 days (oldest → today). Single habit is
  // binary per day, so each point is 100% (done) or 0% (not).
  const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - (6 - i));
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date: ds, label: WEEK_LABELS[d.getDay()], dayNum: d.getDate(), pct: entryMap.get(ds) ? 100 : 0, isToday: ds === todayLocal };
  });
  const weekChartAvg = Math.round((weekChart.filter((w) => w.pct === 100).length / 7) * 100);

  const canGoBack = monthOffset > -3;
  const canGoForward = monthOffset < 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)' }}
      />

      {/* Floating card */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 30, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 480,
            background: 'var(--glass-bg-sheet)',
            borderRadius: 24,
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '24px 20px 32px',
            fontFamily: "system-ui, -apple-system, sans-serif",
            boxShadow: '0 24px 64px rgba(30,27,75,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 0, marginBottom: 22 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 16,
              background: `color-mix(in srgb, ${habit.color || PURPLE} 14%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
              boxShadow: 'none',
            }}>
              <DynamicIcon name={editMode ? editIcon : (habit.icon ?? 'circle-check')} size={26} color={habit.color || PURPLE} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editMode ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--input-bg)', border: `1.5px solid ${PURPLE}`,
                    borderRadius: 10, padding: '8px 12px',
                    fontSize: 17, fontWeight: 700, color: TEXT_DARK,
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
              ) : (
                <>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
                    {habit.name}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>
                    {habit.description ?? (habit.frequency?.type === 'daily' ? 'Daily habit' : 'Habit')}
                  </p>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!editMode && (
                <button
                  onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditColor(habit.color || '#7C3AED'); setEditNotes(habit.description ?? ''); setEditMode(true); }}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: PURPLE_LIGHT, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <DynamicIcon name="pencil" size={16} color={PURPLE} />
                </button>
              )}
              <button
                onClick={editMode ? () => setEditMode(false) : onClose}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: PURPLE_MID, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 18,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Edit mode — icon picker + save */}
          {editMode && (
            <div style={{ ...GLASS_NESTED_PURPLE, borderRadius: 18, padding: '16px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Notes
              </p>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Why this matters, how you'll do it…"
                maxLength={500}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 60,
                  background: 'var(--input-bg)', border: `1.5px solid var(--input-border)`,
                  borderRadius: 10, padding: '8px 12px', marginBottom: 16,
                  fontSize: 14, color: TEXT_DARK, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                }}
                onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
              />
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Choose icon
              </p>
              <div className="hf-icon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 16, maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
                {HABIT_ICONS.map((ic) => {
                  const active = editIcon === ic;
                  return (
                    <button key={ic} onClick={() => setEditIcon(ic)} title={ic} style={{
                      width: '100%', aspectRatio: '1', borderRadius: 12, border: `2px solid ${active ? PURPLE : 'transparent'}`,
                      background: PURPLE_LIGHT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: active ? `0 2px 10px rgba(124,58,237,0.2)` : 'none',
                      transition: 'all 0.15s', transform: active ? 'scale(1.1)' : 'scale(1)',
                    }}>
                      <DynamicIcon name={ic} size={20} color={active ? PURPLE : TEXT_MUTED} />
                    </button>
                  );
                })}
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Color
              </p>
              <div style={{ marginBottom: 16 }}>
                <ColorPicker value={editColor} onChange={setEditColor} />
              </div>
              {saveError && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#EF4444' }}>{saveError}</p>}
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                  background: saving ? 'var(--accent-light)' : PURPLE,
                  color: 'var(--accent-on-primary)', fontSize: 15, fontWeight: 700,
                  cursor: saving ? 'default' : 'pointer',
                  boxShadow: 'none',
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Notes (read mode) */}
          {!editMode && (
            <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: habit.description ? 8 : 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Notes
                </p>
                <button
                  onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditColor(habit.color || '#7C3AED'); setEditNotes(habit.description ?? ''); setEditMode(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontSize: 12.5, fontWeight: 700, padding: 0 }}
                >
                  {habit.description ? 'Edit' : 'Add'}
                </button>
              </div>
              {habit.description ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: TEXT_DARK, whiteSpace: 'pre-wrap' }}>
                  {habit.description}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 13.5, color: TEXT_MUTED }}>
                  No notes yet — tap “Add” to jot why this habit matters.
                </p>
              )}
            </div>
          )}

          {/* Stat pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <StatPill label="Current Streak" value={`${habit.current_streak}d`} accent color={PURPLE} />
            <StatPill label="Longest Streak" value={`${habit.longest_streak}d`} />
            <StatPill label="30-day Rate" value={`${rate}%`} accent color={PURPLE} />
            <StatPill label="Total Done" value={`${habit.total_completions}`} />
          </div>

          {/* Weekly report — this habit, last 7 days */}
          <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '14px 12px 10px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px', marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Weekly report
              </p>
              <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE }}>{weekChartAvg}% avg</span>
            </div>
            {loading
              ? <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '24px 0' }}>Loading…</p>
              : <WeeklyReportChart data={weekChart} avg={weekChartAvg} color={PURPLE} />}
          </div>

          {/* Calendar */}
          <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '16px 14px', marginBottom: 14 }}>
            {/* Month header + navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button
                onClick={() => setMonthOffset((o) => o - 1)}
                disabled={!canGoBack}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: canGoBack ? PURPLE_LIGHT : 'transparent',
                  border: 'none', cursor: canGoBack ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: canGoBack ? PURPLE : 'var(--drag-handle)', fontSize: 18, fontWeight: 700,
                }}
              >‹</button>

              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.01em' }}>
                  {MONTHS[calMonth]} {calYear}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_MUTED }}>
                  {monthDone} done · {monthRate}% this month
                </p>
              </div>

              <button
                onClick={() => setMonthOffset((o) => o + 1)}
                disabled={!canGoForward}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: canGoForward ? PURPLE_LIGHT : 'transparent',
                  border: 'none', cursor: canGoForward ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: canGoForward ? PURPLE : 'var(--drag-handle)', fontSize: 18, fontWeight: 700,
                }}
              >›</button>
            </div>

            {loading ? (
              <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '16px 0' }}>Loading…</p>
            ) : (() => {
              const weeks = Array.from(
                { length: Math.ceil(calCells.length / 7) },
                (_, wi) => calCells.slice(wi * 7, (wi + 1) * 7)
              );
              const CELL_H = 'clamp(30px, 10vw, 40px)';
              const rowStyle: React.CSSProperties = { display: 'flex', gap: '4px', width: '100%' };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  {/* Day-of-week headers */}
                  <div style={rowStyle}>
                    {DOW_LABELS.map((d, i) => (
                      <div key={i} style={{
                        flex: '1 1 0', textAlign: 'center',
                        fontSize: 10, fontWeight: 700, color: TEXT_MUTED,
                        paddingBottom: 4,
                      }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Week rows */}
                  {weeks.map((week, wi) => (
                    <div key={wi} style={rowStyle}>
                      {week.map((cell, di) => {
                        if (!cell) {
                          return <div key={di} style={{ flex: '1 1 0', height: CELL_H }} />;
                        }
                        const bg = cell.isFuture
                          ? 'transparent'
                          : cell.completed
                            ? PURPLE
                            : PURPLE_LIGHT;
                        const txtColor = cell.completed ? '#fff' : cell.isToday ? PURPLE_HEX : cell.isFuture ? 'var(--drag-handle)' : TEXT_MUTED;
                        const interactive = !cell.isFuture;
                        const isSaving = savingDay === cell.date;
                        return (
                          <div
                            key={di}
                            onClick={interactive && !isSaving ? () => markDay(cell.date, cell.completed) : undefined}
                            title={interactive ? (cell.completed ? 'Tap to unmark' : 'Tap to mark done') : undefined}
                            style={{
                              flex: '1 1 0', minWidth: 0,
                              height: CELL_H,
                              borderRadius: 8,
                              background: bg,
                              border: cell.isToday ? `2px solid ${PURPLE}` : '2px solid transparent',
                              boxShadow: cell.completed ? '0 2px 6px rgba(124,58,237,0.28)' : 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: cell.isToday ? 800 : 500,
                              color: txtColor,
                              cursor: interactive ? 'pointer' : 'default',
                              opacity: isSaving ? 0.5 : 1,
                              transition: 'background 0.15s ease, opacity 0.15s ease',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            {cell.day}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 14, marginTop: 10, justifyContent: 'center' }}>
                    {[
                      { bg: PURPLE, label: 'Done', txt: '#fff' },
                      { bg: PURPLE_LIGHT, label: 'Missed', txt: TEXT_MUTED },
                      { bg: 'transparent', label: 'Today', txt: PURPLE, border: `2px solid ${PURPLE}` },
                    ].map(({ bg, label, txt, border }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          background: bg, border: border ?? 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: txt,
                        }} />
                        <span style={{ fontSize: 11, color: TEXT_MUTED }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Completion rate bar */}
          <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT_DARK }}>
                {MONTHS[calMonth]} Completion
              </p>
              <span style={{ fontSize: 13, fontWeight: 700, color: PURPLE }}>{monthRate}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: PURPLE_LIGHT, overflow: 'hidden' }}>
              <motion.div
                key={`${calYear}-${calMonth}`}
                initial={{ width: 0 }}
                animate={{ width: `${monthRate}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${PURPLE}, color-mix(in srgb, ${PURPLE} 65%, #fff))`, borderRadius: 5 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0 0', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>
                <span style={{ fontWeight: 700, color: TEXT_DARK }}>{monthDone}</span> of {daysElapsed} days completed
              </p>
              <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED, whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 700, color: TEXT_DARK }}>{daysRemaining}</span> {daysRemaining === 1 ? 'day' : 'days'} left
              </p>
            </div>
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                marginTop: 16, width: '100%', padding: '14px 0', borderRadius: 16, border: 'none',
                background: 'rgba(239,68,68,0.08)',
                color: '#EF4444', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Delete Habit
            </button>
          ) : (
            <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.08)', borderRadius: 16, padding: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#EF4444', fontWeight: 600, textAlign: 'center' }}>
                Delete &quot;{habit.name}&quot;? This removes all history and cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                    background: PURPLE_LIGHT, color: PURPLE, fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                    background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit',
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

// Single source of truth — same set the standalone IconPicker offers, so habit
// icon choices are identical everywhere (add sheet, edit sheet, HabitForm).
const HABIT_ICONS = HABIT_ICON_NAMES;
// Premium jewel-tone palette — tuned to read well on both the light
// (purple-tinted) and dark surfaces. First entry is the brand violet (default).
const HABIT_COLORS = [
  '#7C3AED', // amethyst (brand)
  '#4F46E5', // indigo
  '#2563EB', // sapphire
  '#0D9488', // teal
  '#059669', // emerald
  '#CA8A04', // gold
  '#E11D48', // rose
  '#C026D3', // fuchsia
];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Glossy radial sheen for a color orb.
const orbGloss = (c: string) =>
  `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${c} 72%, #fff) 0%, ${c} 52%, color-mix(in srgb, ${c} 84%, #000) 100%)`;

/* Premium color picker — glossy "orbs" with a radial sheen and a check on the
   selected swatch, plus a custom-color orb (native color wheel) so any color is
   reachable. Shared by the add + edit sheets so they stay identical. */
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const isCustom = !HABIT_COLORS.includes(value);
  const orbBase: React.CSSProperties = {
    width: 38, height: 38, borderRadius: '50%', padding: 0, border: 'none',
    cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {HABIT_COLORS.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            aria-label={`Color ${c}`}
            aria-pressed={active}
            style={{
              ...orbBase,
              background: orbGloss(c),
              boxShadow: active
                ? `inset 0 1px 1px rgba(255,255,255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${c}`
                : 'inset 0 1px 1px rgba(255,255,255,0.45)',
              transform: active ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {active && <CheckIcon />}
          </button>
        );
      })}

      {/* Custom color — opens the native color wheel */}
      <label
        title="Custom color"
        aria-label="Pick a custom color"
        style={{
          ...orbBase,
          position: 'relative', overflow: 'hidden',
          background: isCustom
            ? orbGloss(value)
            : 'conic-gradient(from 90deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
          boxShadow: isCustom
            ? `inset 0 1px 1px rgba(255,255,255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${value}`
            : 'inset 0 1px 1px rgba(255,255,255,0.45)',
          transform: isCustom ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <input
          type="color"
          value={isCustom ? value : '#7C3AED'}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
        />
        {isCustom ? <CheckIcon /> : <Plus size={18} color="#fff" strokeWidth={2.6} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }} />}
      </label>
    </div>
  );
}

type FreqType = 'daily' | 'weekly' | 'x_per_week';
type TargetType = 'boolean' | 'duration';

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '16px 16px', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</p>;
}

function AddHabitSheet({ onSuccess, onClose }: { onSuccess: (h: Habit) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState('circle-check');
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [color, setColor] = useState('#7C3AED');
  const [freqType, setFreqType] = useState<FreqType>('daily');
  const [days, setDays] = useState<number[]>([]);
  const [perWeek, setPerWeek] = useState(3);
  const [targetType, setTargetType] = useState<TargetType>('boolean');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (d: number) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b));

  const buildFrequency = () => {
    if (freqType === 'weekly') return { type: 'weekly', days };
    if (freqType === 'x_per_week') return { type: 'x_per_week', count: perWeek };
    return { type: 'daily' };
  };

  const submit = async () => {
    if (!name.trim()) { setError('Give your habit a name.'); return; }
    if (freqType === 'weekly' && days.length === 0) { setError('Pick at least one day.'); return; }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(), icon, color,
        frequency: buildFrequency(),
        target_type: targetType,
        target_value: targetType === 'duration' ? duration : 1,
        target_unit: targetType === 'duration' ? 'min' : null,
        is_bad_habit: false,
      };
      if (notes.trim()) body.description = notes.trim();

      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      onSuccess(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setLoading(false);
    }
  };

  const freqTabs: { key: FreqType; label: string }[] = [
    { key: 'daily', label: 'Every Day' },
    { key: 'weekly', label: 'Specific Days' },
    { key: 'x_per_week', label: 'Per Week' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--input-bg)', border: `1.5px solid var(--input-border)`,
    borderRadius: 12, padding: '13px 16px',
    fontSize: 16, fontWeight: 600, color: TEXT_DARK,
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)' }}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 30, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 480,
            background: 'var(--glass-bg-sheet)',
            borderRadius: 24,
            maxHeight: '90dvh', overflowY: 'auto',
            padding: '24px 16px 32px',
            fontFamily: "system-ui, -apple-system, sans-serif",
            boxShadow: '0 24px 64px rgba(30,27,75,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 0, marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>New Habit</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: TEXT_MUTED }}>Build a streak that sticks</p>
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: '50%', background: PURPLE_MID,
              border: 'none', cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>×</button>
          </div>

          {/* ── Name ── */}
          <SectionCard>
            <FieldLabel>Habit name</FieldLabel>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="e.g. Morning Run"
              style={{ ...inputStyle, border: `1.5px solid ${error && !name.trim() ? '#EF4444' : 'var(--input-border)'}` }}
              onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
            />

            <div style={{ marginTop: 14 }}>
              <FieldLabel>Notes (optional)</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why this matters, how you'll do it…"
                maxLength={500}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 64, lineHeight: 1.5, border: '1.5px solid var(--input-border)' }}
                onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
              />
            </div>
          </SectionCard>

          {/* ── Icon + Color ── */}
          <SectionCard>
            <FieldLabel>Icon</FieldLabel>
            <div className="hf-icon-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 12,
            }}>
              {(showAllIcons ? HABIT_ICONS : HABIT_ICONS.slice(0, 6)).map((ic) => {
                const active = icon === ic;
                return (
                  <button key={ic} onClick={() => setIcon(ic)} title={ic} style={{
                    width: '100%', aspectRatio: '1', borderRadius: 12,
                    border: `1.5px solid ${active ? PURPLE : 'transparent'}`,
                    background: active ? 'var(--surface-tint-mid)' : PURPLE_LIGHT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
                  }}>
                    <DynamicIcon name={ic} size={20} color={active ? PURPLE : TEXT_MUTED} />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowAllIcons((v) => !v)}
              style={{
                border: 'none', background: 'transparent', color: PURPLE,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '2px 0',
                marginBottom: 18,
              }}
            >
              {showAllIcons ? 'Show less' : `View more (${HABIT_ICONS.length - 6})`}
            </button>
            <FieldLabel>Color</FieldLabel>
            <ColorPicker value={color} onChange={setColor} />
          </SectionCard>

          {/* ── Frequency ── */}
          <SectionCard>
            <FieldLabel>How often</FieldLabel>
            <div style={{ display: 'flex', background: 'var(--surface-tint)', borderRadius: 12, padding: 3, gap: 3, marginBottom: 14 }}>
              {freqTabs.map(({ key, label }) => (
                <button key={key} onClick={() => setFreqType(key)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none',
                  background: freqType === key ? PURPLE : 'transparent',
                  color: freqType === key ? '#fff' : TEXT_MUTED,
                  fontSize: 12, fontWeight: freqType === key ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{label}</button>
              ))}
            </div>

            {freqType === 'weekly' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {DAY_LABELS.map((label, idx) => {
                  const active = days.includes(idx);
                  return (
                    <button key={idx} onClick={() => toggleDay(idx)} style={{
                      width: 38, height: 38, borderRadius: '50%', border: 'none',
                      background: active ? color : '#F5F3FF',
                      color: active ? '#fff' : TEXT_MUTED,
                      fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: active ? `0 2px 8px rgba(124,58,237,0.3)` : 'none',
                    }}>{label}</button>
                  );
                })}
              </div>
            )}

            {freqType === 'x_per_week' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_DARK, fontWeight: 600 }}>
                  {perWeek}× per week
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setPerWeek((n) => Math.max(1, n - 1))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'var(--surface-tint)', color: PURPLE, fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <span style={{ width: 28, textAlign: 'center', fontSize: 20, fontWeight: 800, color: TEXT_DARK }}>{perWeek}</span>
                  <button onClick={() => setPerWeek((n) => Math.min(7, n + 1))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: PURPLE, color: '#fff', fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Target / Timer ── */}
          <SectionCard>
            <FieldLabel>Target type</FieldLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: targetType === 'duration' ? 16 : 0 }}>
              {(['boolean', 'duration'] as TargetType[]).map((t) => (
                <button key={t} onClick={() => setTargetType(t)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                  background: targetType === t ? color : '#F5F3FF',
                  color: targetType === t ? '#fff' : TEXT_MUTED,
                  fontSize: 13, fontWeight: targetType === t ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: targetType === t ? `0 2px 10px rgba(124,58,237,0.25)` : 'none',
                }}>
                  {t === 'boolean' ? 'Check-off' : 'Duration'}
                </button>
              ))}
            </div>

            {targetType === 'duration' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_DARK, fontWeight: 600 }}>{duration} minutes</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setDuration((n) => Math.max(5, n - 5))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'var(--surface-tint)', color: PURPLE, fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontSize: 20, fontWeight: 800, color: TEXT_DARK }}>{duration}</span>
                  <button onClick={() => setDuration((n) => Math.min(240, n + 5))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: PURPLE, color: '#fff', fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#EF4444', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 18, border: 'none',
              background: loading ? 'var(--accent-light)' : 'var(--accent-primary)',
              color: 'var(--accent-on-primary)', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Saving…' : 'Create Habit'}
          </button>
        </motion.div>
      </div>
    </>
  );
}

function ProfileMenu({
  displayName, initials, email, totalHabits, onClose,
}: {
  displayName: string; initials: string; email: string;
  totalHabits: number; onClose: () => void;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    // Reflect whatever theme is actually applied (system-resolved by the
    // pre-paint script when there's no pinned override), not a hardcoded default.
    return document.documentElement.dataset.theme !== 'light';
  });

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('semma_flow_theme', next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut();
      window.location.href = '/';
    } catch { setSigningOut(false); }
  };

  const menuItems: { icon: string; label: string; sub: string; href?: string }[] = [
    { icon: 'mountain', label: 'Trip Planner', sub: 'Expenses & settlement', href: '/trip' },
    { icon: 'zap', label: 'Your Coach', sub: 'Weekly AI insights', href: '/dashboard/coach' },
    { icon: 'calendar-check', label: 'Year in Review', sub: 'Highlights & PDF export', href: '/dashboard/year-in-review' },
    { icon: 'bell', label: 'Notifications', sub: 'Reminders & alerts' },
    { icon: 'help-circle', label: 'Help & Feedback', sub: 'Support & suggestions' },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 399, background: 'rgba(0,0,0,0.45)' }}
      />

      {/* Sheet — slides up from bottom */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
          maxHeight: '93dvh',
          background: 'var(--bg-primary)',
          borderRadius: '24px 24px 0 0',
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Inner centred column */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 48px', display: 'flex', flexDirection: 'column' }}>

          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 'var(--r-pill)', background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(124,58,237,0.18)' }} />
          </div>

          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8 }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(60,40,120,0.70)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Profile
            </p>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(124,58,237,0.08)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <DynamicIcon name="x" size={18} color={PURPLE} />
            </button>
          </motion.div>

          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              marginTop: 16,
              background: isDark
                ? 'linear-gradient(155deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)'
                : 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.55) 100%)',
              borderRadius: 28,
              padding: '28px 24px 24px',
              boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(255,255,255,0.08)'
                : '0 4px 24px rgba(100,80,200,0.12), inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(255,255,255,0.90)',
              border: 'none',
            }}
          >
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: `linear-gradient(135deg, ${PURPLE} 0%, #A855F7 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
                boxShadow: 'none',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.10)', margin: '20px 0' }} />

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Habits', value: String(totalHabits) },
                { label: 'Today', value: new Date().toLocaleDateString('en-US', { weekday: 'short' }) },
                { label: 'Plan', value: 'Free' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  flex: 1,
                  background: isDark
                    ? 'linear-gradient(155deg, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.10) 100%)'
                    : 'linear-gradient(155deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.06) 100%)',
                  borderRadius: 14,
                  padding: '12px 10px', textAlign: 'center',
                  boxShadow: isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(124,58,237,0.28)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.90), 0 0 0 1px rgba(124,58,237,0.14)',
                }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT_DARK }}>{value}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Theme toggle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              marginTop: 16,
              background: isDark
                ? 'linear-gradient(155deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)'
                : 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.55) 100%)',
              borderRadius: 24, padding: '16px 20px',
              boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(255,255,255,0.08)'
                : '0 4px 24px rgba(100,80,200,0.10), inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(255,255,255,0.90)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DynamicIcon name={isDark ? 'moon' : 'sun'} size={18} color={PURPLE_HEX} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: TEXT_MUTED }}>Premium theme</p>
              </div>
            </div>
            <ToggleSwitch
              checked={isDark}
              onChange={toggleTheme}
              ariaLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onIcon="moon"
              offIcon="sun"
              onIconColor={PURPLE_HEX}
              offIconColor="#F59E0B"
            />
          </motion.div>

          {/* Menu items */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              marginTop: 16,
              background: isDark
                ? 'linear-gradient(155deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)'
                : 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.55) 100%)',
              borderRadius: 24, overflow: 'hidden',
              boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(255,255,255,0.08)'
                : '0 4px 24px rgba(100,80,200,0.10), inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(255,255,255,0.90)',
              border: 'none',
            }}
          >
            {menuItems.map(({ icon, label, sub, href }, idx) => (
              <div key={label}>
                {idx > 0 && <div style={{ height: 1, background: 'rgba(124,58,237,0.06)', marginLeft: 62 }} />}
                <button
                  onClick={() => { if (href) window.location.href = href; }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 20px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <DynamicIcon name={icon} size={18} color={PURPLE} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>{label}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 12, color: TEXT_MUTED }}>{sub}</p>
                  </div>
                  <DynamicIcon name="chevron-right" size={16} color={TEXT_MUTED} />
                </button>
              </div>
            ))}
          </motion.div>

          {/* Sign out */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, type: 'spring', damping: 28, stiffness: 280 }}
            style={{ marginTop: 16 }}
          >
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 20, border: 'none',
                background: isDark
                  ? 'linear-gradient(155deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.10) 100%)'
                  : 'linear-gradient(155deg, rgba(255,255,255,0.80) 0%, rgba(255,230,230,0.60) 100%)',
                color: isDark ? '#F87171' : '#DC2626',
                fontSize: 15, fontWeight: 700,
                cursor: signingOut ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'inherit',
                boxShadow: isDark
                  ? 'inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(239,68,68,0.22)'
                  : 'inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(239,68,68,0.18)',
              }}
            >
              <DynamicIcon name="log-out" size={18} color="#EF4444" />
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </motion.div>


        </div>
      </motion.div>
    </>
  );
}

export default function FitnessSummary({
  stats,
  habits,
  weekData,
  displayName = 'User',
  initials = '?',
  email = '',
  onBackToHub,
}: FitnessSummaryProps) {
  const [localHabits, setLocalHabits] = useState<HabitWithEntry[]>(habits);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [dateEntries, setDateEntries] = useState<Record<string, boolean>>({});
  const [loadingDate, setLoadingDate] = useState(false);

  const isViewingToday = selectedDate === todayString();

  const selectDate = async (date: string) => {
    if (date === selectedDate) return;
    setSelectedDate(date);
    if (date === todayString()) { setDateEntries({}); return; }
    setLoadingDate(true);
    try {
      const res = await fetch(`/api/entries?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, boolean> = {};
        (json.data ?? []).forEach((e: { habit_id: string; is_completed: boolean }) => {
          map[e.habit_id] = e.is_completed;
        });
        setDateEntries(map);
      }
    } catch { }
    setLoadingDate(false);
  };

  const handleAddSuccess = (saved: Habit) => {
    setLocalHabits((prev) => [...prev, { ...saved, todayEntry: null, completionRate: 0 } as HabitWithEntry]);
    setAddOpen(false);
  };

  const handleUpdate = (updated: Partial<HabitWithEntry> & { id: string }) => {
    setLocalHabits((prev) => prev.map((h) => h.id === updated.id ? { ...h, ...updated } : h));
  };

  const handleDelete = (id: string) => {
    setLocalHabits((prev) => prev.filter((h) => h.id !== id));
    setSelectedId(null);
  };

  const goodHabits = localHabits.filter((h) => !h.is_bad_habit);

  // Habits displayed with the selected date's completion state
  const displayHabits = isViewingToday
    ? goodHabits
    : goodHabits.map((h) => ({
      ...h,
      todayEntry: { habit_id: h.id, is_completed: dateEntries[h.id] ?? false } as HabitWithEntry['todayEntry'],
    }));

  const completedCount = displayHabits.filter((h) => h.todayEntry?.is_completed).length;
  const totalCount = displayHabits.length;
  const todayPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Bad habits — checking one off means it was *avoided* on the selected date.
  const badHabits = localHabits.filter((h) => h.is_bad_habit);
  const displayBadHabits = isViewingToday
    ? badHabits
    : badHabits.map((h) => ({
      ...h,
      todayEntry: { habit_id: h.id, is_completed: dateEntries[h.id] ?? false } as HabitWithEntry['todayEntry'],
    }));
  const avoidedCount = displayBadHabits.filter((h) => h.todayEntry?.is_completed).length;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  // Week date strip — sorted 7 days with actual calendar numbers
  const weekDates = [...weekData]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, percentage }) => {
      const d = new Date(date + 'T00:00:00');
      const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const isToday = date === todayString();
      return { date, dayNum: d.getDate(), dayLabel: LABELS[d.getDay()], isToday, pct: percentage };
    });

  // Consistency score bars — same 7 days as the week strip, oldest→today left→right.
  // Override today's pct with the live todayPct so bars update as the user checks habits.
  const weekBars = weekDates.map((wd) =>
    wd.isToday ? { ...wd, pct: todayPct } : wd
  );
  const avgPct = weekBars.length
    ? Math.round(weekBars.reduce((s, b) => s + b.pct, 0) / weekBars.length)
    : 0;

  const handleToggle = async (id: string, currentDone: boolean) => {
    // Optimistic update
    if (isViewingToday) {
      setLocalHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, todayEntry: { ...(h.todayEntry ?? {}), habit_id: id, is_completed: !currentDone } as HabitWithEntry['todayEntry'] }
            : h
        )
      );
    } else {
      setDateEntries((prev) => ({ ...prev, [id]: !currentDone }));
    }
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: id, entry_date: selectedDate, is_completed: !currentDone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[handleToggle] API error', res.status, body);
        throw new Error(`Failed to save entry: ${res.status} ${JSON.stringify(body)}`);
      }
    } catch (err) {
      console.error('[handleToggle] toggle failed, reverting:', err);
      if (isViewingToday) {
        setLocalHabits((prev) =>
          prev.map((h) =>
            h.id === id
              ? { ...h, todayEntry: { ...(h.todayEntry ?? {}), habit_id: id, is_completed: currentDone } as HabitWithEntry['todayEntry'] }
              : h
          )
        );
      } else {
        setDateEntries((prev) => ({ ...prev, [id]: currentDone }));
      }
    }
  };


  return (
    <div style={{
      background: 'var(--bg-primary)',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: 32,
      overflowX: 'hidden',
      position: 'relative',
      minHeight: '100dvh',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ paddingTop: 24, paddingBottom: 4 }}
        >
          {onBackToHub && (
            <button
              onClick={onBackToHub}
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.20)',
                borderRadius: 12,
                color: 'var(--accent-light)',
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 16,
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.15s ease',
              }}
            >
              ← Back to App Hub
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              {greeting},<br />{displayName.split(' ')[0]} 👋
            </h1>
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, marginTop: 4,
              }}
            >
              <User size={19} color={TEXT_MUTED} />
            </button>
          </div>

          {/* Date + Add */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: TEXT_DARK }}>{dateStr}</p>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-default)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Plus size={20} color={PURPLE} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>

        {/* ── Week Date Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          style={{ marginTop: 22 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {weekDates.map(({ date, dayNum, dayLabel, isToday, pct }) => {
              const R = 19, CIRC = 2 * Math.PI * R;
              const isSelected = date === selectedDate;
              return (
                <div
                  key={date}
                  onClick={() => selectDate(date)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? PURPLE : TEXT_MUTED }}>
                    {dayLabel}
                  </span>
                  <div style={{ position: 'relative', width: 42, height: 42 }}>
                    {isToday ? (
                      <>
                        <svg width="42" height="42" style={{ position: 'absolute', inset: 0 }}>
                          <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="2.5" />
                          <circle cx="21" cy="21" r={R} fill="none" stroke={PURPLE_HEX}
                            strokeWidth="2.5" strokeLinecap="round"
                            strokeDasharray={CIRC}
                            strokeDashoffset={CIRC * (1 - todayPct / 100)}
                            transform="rotate(-90 21 21)"
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                          />
                        </svg>
                        <div style={{
                          position: 'absolute', inset: 5, borderRadius: '50%',
                          background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{dayNum}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: isSelected
                          ? PURPLE
                          : pct > 0 ? 'var(--glass-bg-purple)' : 'var(--bg-secondary)',
                        border: isSelected
                          ? 'none'
                          : `1px solid ${pct > 0 ? 'rgba(124,58,237,0.2)' : 'var(--border-subtle)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.18s ease',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#fff' : pct > 0 ? PURPLE : TEXT_MUTED }}>
                          {dayNum}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Weekly Report ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          style={{ marginTop: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
              Weekly report
            </h2>
            <span style={{ fontSize: 13, fontWeight: 700, color: PURPLE }}>{avgPct}% avg</span>
          </div>
          <div style={{ ...GLASS, borderRadius: 20, padding: '18px 12px 12px' }}>
            <WeeklyReportChart
              data={weekBars.map(({ date, dayLabel, dayNum, pct, isToday }) => ({ date, label: dayLabel, dayNum, pct, isToday }))}
              avg={avgPct}
            />
          </div>
        </motion.div>

        {/* ── Consistency Score ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          style={{ marginTop: 32 }}
        >
          <h2 style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
            Consistency score
          </h2>
          <div style={{ ...GLASS, borderRadius: 20, padding: '20px 14px 14px' }}>
            {/* Bar chart — fixed 88px track height, avg line overlaid */}
            <div style={{ position: 'relative' }}>
              {/* Bars row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 5 }}>
                {weekBars.map(({ date, dayLabel, dayNum, pct, isToday }, i) => {
                  const TRACK_H = 88;
                  const barH = Math.max(pct > 0 ? 8 : 0, Math.round((pct / 100) * TRACK_H));
                  return (
                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: '100%', height: TRACK_H, borderRadius: 10,
                        background: 'rgba(124,58,237,0.10)',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: barH }}
                          transition={{ duration: 0.5, delay: 0.08 + i * 0.05, ease: 'easeOut' }}
                          style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            borderRadius: '8px 8px 0 0',
                            background: isToday ? PURPLE_HEX : 'rgba(124,58,237,0.55)',
                          }}
                        />
                      </div>
                      {/* Label: day name + date number */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: 9, fontWeight: 500, color: isToday ? PURPLE : TEXT_MUTED }}>
                          {dayLabel}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? PURPLE : TEXT_DARK }}>
                          {dayNum}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Avg line — positioned absolutely over the bars (88px track, 8px gap, label row) */}
              {avgPct > 0 && (
                <div style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  top: 88 - Math.round((avgPct / 100) * 88),
                  borderTop: '1.5px dashed rgba(124,58,237,0.40)',
                  pointerEvents: 'none', zIndex: 2,
                }}>
                  <span style={{
                    position: 'absolute', left: 0, top: -9,
                    fontSize: 10, fontWeight: 700, color: TEXT_MUTED,
                    background: 'var(--glass-bg)', padding: '1px 5px', borderRadius: 4,
                  }}>
                    Avg.{avgPct}%
                  </span>
                </div>
              )}
            </div>
            {todayPct > 0 && (
              <div style={{
                marginTop: 14, paddingTop: 14,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, color: TEXT_MUTED }}>Today&apos;s score</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: PURPLE }}>{todayPct}%</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Today's Habits ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
              {isViewingToday ? "Today's Habits" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h2>
            <span style={{ fontSize: 13, fontWeight: 600, color: loadingDate ? TEXT_MUTED : PURPLE }}>
              {loadingDate ? 'Loading…' : `${completedCount}/${totalCount} done`}
            </span>
          </div>

          {displayHabits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '32px 20px',
                ...GLASS_SM,
                borderRadius: 18,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontSize: 15, color: TEXT_MUTED }}>No habits yet.</p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayHabits.map((h, i) => (
                <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} />
              ))}
            </div>
          )}
        </div>

        {/* ── Bad Habits (avoidance tracking) ── */}
        {displayBadHabits.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DynamicIcon name="ban" size={18} color={RED} />
                Bad Habits
              </h2>
              <span style={{ fontSize: 13, fontWeight: 600, color: loadingDate ? TEXT_MUTED : RED_SOFT }}>
                {loadingDate ? 'Loading…' : `${avoidedCount}/${displayBadHabits.length} avoided`}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayBadHabits.map((h, i) => (
                <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} bad />
              ))}
            </div>
          </div>
        )}

        {/* ── Today's Progress Ring ── */}
        {isViewingToday && <CircularProgress completed={completedCount} total={totalCount} />}

      </div>

      {/* ── Habit Detail Sheet ── */}
      <AnimatePresence>
        {selectedId && (() => {
          const h = localHabits.find((x) => x.id === selectedId);
          return h ? (
            <HabitDetailSheet
              key={selectedId}
              habit={h}
              onClose={() => setSelectedId(null)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ) : null;
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {addOpen && (
          <AddHabitSheet
            key="add-sheet"
            onSuccess={handleAddSuccess}
            onClose={() => setAddOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <ProfileMenu
            key="profile-menu"
            displayName={displayName}
            initials={initials}
            email={email}
            totalHabits={localHabits.length}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
