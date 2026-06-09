'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Plus, LayoutDashboard, BarChart3, Trophy, Sparkles,
  CalendarCheck, Compass, Settings, Flame, CheckCircle2, TrendingUp,
  Target, Sun, Moon, ArrowLeft, Wallet, Receipt, MapPin, ExternalLink,
  Luggage, Coins, ChevronDown, Ban,
} from 'lucide-react';
import { DynamicIcon, HABIT_ICON_NAMES } from '@/lib/icons';
import DevicesModal from '@/components/settings/DevicesModal';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import WeeklyReportChart from '@/components/dashboard/WeeklyReportChart';
import { useAccentColor } from '@/components/ui/ThemeProvider';
import type { OverviewStats } from '@/types/analytics';
import type { HabitWithEntry, Habit } from '@/types/habit';
import { todayString } from '@/lib/utils/dates';
import type { Trip, TripExpense, TripSettlement } from '@/lib/trip/types';
import { computeSettlement } from '@/lib/trip/settlement';
import { formatINR, daysUntil } from '@/lib/trip/format';

interface FitnessSummaryProps {
  stats: OverviewStats | null;
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  displayName?: string;
  initials?: string;
  email?: string;
  onBackToHub?: () => void;
  activeTrip?: Trip | null;
  tripExpenses?: TripExpense[];
  tripSettlements?: TripSettlement[];
}

const PURPLE = 'var(--accent-primary)';
const PURPLE_LIGHT = 'var(--surface-tint)';
const PURPLE_MID = 'var(--surface-tint-mid)';
const TEXT_DARK = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
// Raw hex needed only for SVG attributes and rgba() calls
const PURPLE_HEX = '#7C3AED';

// Bad-habit theming — red accents, kept consistent with HabitCard/HabitList
const RED = '#F87171';
const RED_SOFT = '#FCA5A5';
const RED_LIGHT = 'rgba(248, 113, 113, 0.12)';

// Liquid glass helpers (inline style objects)
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
  const accentHex = useAccentColor();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const size = (RADIUS + STROKE) * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      style={{
        marginTop: 0,
        padding: '20px',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
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
          background: 'var(--surface-tint)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK }}>{pct}%</span>
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
            style={{ stroke: `color-mix(in srgb, ${accentHex} 22%, transparent)` }}
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={RADIUS}
            fill="none"
            stroke={accentHex}
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
                background: i < completed ? accentHex : 'transparent',
                border: `2px solid ${i < completed ? accentHex : `color-mix(in srgb, ${accentHex} 30%, transparent)`}`,
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
  // All regular habits use the system theme accent — no per-habit color.
  const accent = bad ? RED : PURPLE;
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
        ...(bad ? { border: `1px solid ${done ? 'rgba(248, 113, 113, 0.35)' : 'rgba(248, 113, 113, 0.18)'}` } : null),
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
          border: `2px solid ${done ? accent : `color-mix(in srgb, ${accent} 45%, transparent)`}`,
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
        background: 'rgba(127, 127, 127,0.10)',
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
  // ── Theme the whole sheet with the system accent color ──
  // All habit sheets use the live theme accent — no per-habit overrides.
  const sheetAccentHex = useAccentColor();
  const PURPLE = sheetAccentHex;
  const PURPLE_HEX = PURPLE;
  const PURPLE_LIGHT = `color-mix(in srgb, ${PURPLE} 14%, transparent)`;
  const PURPLE_MID = `color-mix(in srgb, ${PURPLE} 24%, transparent)`;

  const [entries, setEntries] = useState<{ entry_date: string; is_completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editIcon, setEditIcon] = useState(habit.icon ?? 'circle-check');
  const [editColor, setEditColor] = useState(sheetAccentHex);
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
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0, 0, 0,0.45)' }}
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
            boxShadow: '0 24px 64px rgba(31, 31, 31,0.40), inset 0 1px 0 rgba(255, 255, 255,0.12)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 0, marginBottom: 22 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 16,
              background: PURPLE_LIGHT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
              boxShadow: 'none',
            }}>
              <DynamicIcon name={editMode ? editIcon : (habit.icon ?? 'circle-check')} size={26} color={PURPLE} />
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
                  onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditColor(habit.color || '#555555'); setEditNotes(habit.description ?? ''); setEditMode(true); }}
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
                      boxShadow: active ? `0 2px 10px ${PURPLE_LIGHT}` : 'none',
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
              {saveError && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6a6a6a' }}>{saveError}</p>}
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
                  onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditColor(habit.color || '#555555'); setEditNotes(habit.description ?? ''); setEditMode(true); }}
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
                              boxShadow: cell.completed ? `0 2px 6px ${PURPLE_MID}` : 'none',
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
                background: 'rgba(104, 104, 104,0.08)',
                color: '#6a6a6a', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Delete Habit
            </button>
          ) : (
            <div style={{ marginTop: 16, background: 'rgba(104, 104, 104,0.08)', borderRadius: 16, padding: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6a6a6a', fontWeight: 600, textAlign: 'center' }}>
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
                    background: '#6a6a6a', color: '#fff', fontSize: 14, fontWeight: 700,
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
  '#0891B2', // teal
  '#059669', // emerald
  '#D97706', // gold
  '#DB2777', // rose
  '#E11D48', // fuchsia
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
                ? `inset 0 1px 1px rgba(255, 255, 255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${c}`
                : 'inset 0 1px 1px rgba(255, 255, 255,0.45)',
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
            : 'conic-gradient(from 90deg, #6a6a6a, #a6a6a6, #b2b2b2, #9b9b9b, #939393, #7b7b7b, #707070, #717171, #6a6a6a)',
          boxShadow: isCustom
            ? `inset 0 1px 1px rgba(255, 255, 255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${value}`
            : 'inset 0 1px 1px rgba(255, 255, 255,0.45)',
          transform: isCustom ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <input
          type="color"
          value={isCustom ? value : '#555555'}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
        />
        {isCustom ? <CheckIcon /> : <Plus size={18} color="#fff" strokeWidth={2.6} style={{ filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0,0.35))' }} />}
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

function AddHabitSheet({ onSuccess, onClose, initialBad = false }: { onSuccess: (h: Habit) => void; onClose: () => void; initialBad?: boolean }) {
  const accentHex = useAccentColor();
  const [isBadHabit, setIsBadHabit] = useState(initialBad);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState(initialBad ? 'ban' : 'circle-check');
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [color, setColor] = useState(() => initialBad ? RED : accentHex);
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
        is_bad_habit: isBadHabit,
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
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0, 0, 0,0.45)' }}
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
            boxShadow: '0 24px 64px rgba(31, 31, 31,0.40), inset 0 1px 0 rgba(255, 255, 255,0.12)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 0, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
                {isBadHabit ? 'Track Bad Habit' : 'New Habit'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: TEXT_MUTED }}>
                {isBadHabit ? 'Check off days you successfully avoided it' : 'Build a streak that sticks'}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: '50%', background: PURPLE_MID,
              border: 'none', cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>×</button>
          </div>

          {/* Good / Bad toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setIsBadHabit(false); if (isBadHabit) { setIcon('circle-check'); setColor(accentHex); } }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 14, border: 'none',
                background: !isBadHabit ? accentHex : 'var(--bg-elevated)',
                color: !isBadHabit ? '#fff' : TEXT_MUTED,
                fontSize: 13, fontWeight: !isBadHabit ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: !isBadHabit ? `0 2px 12px color-mix(in srgb, ${accentHex} 35%, transparent)` : 'none',
              }}
            >
              <CheckCircle2 size={15} />
              Good Habit
            </button>
            <button
              type="button"
              onClick={() => { setIsBadHabit(true); if (!isBadHabit) { setIcon('ban'); setColor(RED); } }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 14, border: 'none',
                background: isBadHabit ? RED : 'var(--bg-elevated)',
                color: isBadHabit ? '#fff' : TEXT_MUTED,
                fontSize: 13, fontWeight: isBadHabit ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: isBadHabit ? '0 2px 12px rgba(248,113,113,0.35)' : 'none',
              }}
            >
              <Ban size={15} />
              Bad Habit
            </button>
          </div>

          {/* ── Name ── */}
          <SectionCard>
            <FieldLabel>Habit name</FieldLabel>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="e.g. Morning Run"
              style={{ ...inputStyle, border: `1.5px solid ${error && !name.trim() ? '#6a6a6a' : 'var(--input-border)'}` }}
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
                      background: active ? color : 'var(--bg-elevated)',
                      color: active ? '#fff' : TEXT_MUTED,
                      fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: active ? `0 2px 8px color-mix(in srgb, ${color} 30%, transparent)` : 'none',
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
                  background: targetType === t ? color : 'var(--bg-elevated)',
                  color: targetType === t ? '#fff' : TEXT_MUTED,
                  fontSize: 13, fontWeight: targetType === t ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: targetType === t ? `0 2px 10px color-mix(in srgb, ${color} 25%, transparent)` : 'none',
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
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(104, 104, 104,0.08)', border: '1px solid rgba(104, 104, 104,0.2)', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#6a6a6a', fontWeight: 600 }}>{error}</p>
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

// ── Admin-dashboard building blocks ──────────────────────────────────────
// KPI stat card — label + icon chip + big number. Pure monochrome (theme vars).
function KpiCard({
  icon, label, value, suffix, sub,
}: {
  icon: React.ReactNode; label: string; value: string | number; suffix?: string; sub?: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 18,
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 16,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'var(--surface-tint)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
          {suffix && <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dimmed)', marginLeft: 2 }}>{suffix}</span>}
        </p>
        {sub && (
          <p style={{ margin: '7px 0 0', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// Generic widget card — titled panel that wraps charts / lists in the grid.
function DashCard({
  title, action, children, style,
}: {
  title?: string; action?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 20,
      padding: 20,
      minWidth: 0,
      ...style,
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// Sidebar nav row — filled when active, hover tint otherwise.
function NavItem({
  icon, label, active = false, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'var(--accent-on-primary)' : 'var(--text-secondary)',
        fontSize: 14, fontWeight: active ? 700 : 600, fontFamily: 'inherit', textAlign: 'left',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-tint)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

// Expandable white-button group with sub-items
function NavGroup({
  icon, label, expanded, onToggle, children,
}: {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* White pill header button */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#ffffff',
          color: '#1a1a1a',
          fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', textAlign: 'left',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <span style={{ display: 'flex', flexShrink: 0, color: '#1a1a1a' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={15} color="var(--text-muted)" />
        </motion.span>
      </button>

      {/* Sub-items with animated expand */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 0,
              paddingLeft: 14,
              borderLeft: '2px solid rgba(255,255,255,0.12)',
              marginLeft: 10,
              marginTop: 2,
              marginBottom: 4,
            }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-item inside a NavGroup
function SubNavItem({
  icon, label, active = false, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'inherit', textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
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
  activeTrip = null,
  tripExpenses = [],
  tripSettlements = [],
}: FitnessSummaryProps) {
  const accentHex = useAccentColor();
  const [localHabits, setLocalHabits] = useState<HabitWithEntry[]>(habits);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addBadDefault, setAddBadDefault] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [dateEntries, setDateEntries] = useState<Record<string, boolean>>({});
  const [loadingDate, setLoadingDate] = useState(false);
  const [habitNavOpen, setHabitNavOpen] = useState(true);
  const [tripNavOpen, setTripNavOpen] = useState(false);

  // ── Theme (sidebar/topbar quick toggle) ──
  // Reflect the theme actually applied to <html>; re-sync after the profile
  // sheet closes since that sheet can also flip the theme.
  const [isDark, setIsDark] = useState(true);
  useEffect(() => { setIsDark(document.documentElement.dataset.theme !== 'light'); }, []);
  useEffect(() => { if (!menuOpen) setIsDark(document.documentElement.dataset.theme !== 'light'); }, [menuOpen]);
  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('productivity_master_theme', next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

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
      overflowX: 'hidden',
      position: 'relative',
      minHeight: '100dvh',
    }}>
      {/* Desktop Sidebar is rendered by layout.tsx */}

      {/* ───────────────── Main ───────────────── */}
      <div>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: 'clamp(18px, 2.5vw, 32px) clamp(16px, 2.5vw, 32px) 72px',
          display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 22px)',
        }}>
          {/* ── Topbar ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                {greeting}, {displayName.split(' ')[0]} 👋
              </p>
              <h1 style={{ margin: '3px 0 0', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
                Overview
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setAddOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '11px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                }}
              >
                <Plus size={18} strokeWidth={2.6} />
                <span className="hf-dash-btn-label">New Habit</span>
              </button>
              <Link
                href="/dashboard/settings"
                aria-label="Open profile settings"
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <User size={19} color="var(--text-muted)" />
              </Link>
            </div>
          </motion.div>

          {/* ── Week day selector ── */}
          <DashCard
            title={isViewingToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            action={
              !isViewingToday ? (
                <button
                  onClick={() => selectDate(todayString())}
                  style={{ background: 'var(--surface-tint)', border: '1px solid var(--border-default)', borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Jump to today
                </button>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{dateStr}</span>
              )
            }
          >
            <div className="hf-weekly-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
              {weekDates.map(({ date, dayNum, dayLabel, isToday, pct }) => {
                const R = 19, CIRC = 2 * Math.PI * R;
                const isSelected = date === selectedDate;
                return (
                  <div
                    key={date}
                    onClick={() => selectDate(date)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      {dayLabel}
                    </span>
                    <div style={{ position: 'relative', width: 42, height: 42 }}>
                      {isToday ? (
                        <>
                          <svg width="42" height="42" style={{ position: 'absolute', inset: 0 }}>
                            <circle cx="21" cy="21" r={R} fill="none" style={{ stroke: `color-mix(in srgb, ${accentHex} 22%, transparent)` }} strokeWidth="2.5" />
                            <circle cx="21" cy="21" r={R} fill="none" stroke={accentHex}
                              strokeWidth="2.5" strokeLinecap="round"
                              strokeDasharray={CIRC}
                              strokeDashoffset={CIRC * (1 - todayPct / 100)}
                              transform="rotate(-90 21 21)"
                              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                            />
                          </svg>
                          <div style={{
                            position: 'absolute', inset: 5, borderRadius: '50%',
                            background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-on-primary)' }}>{dayNum}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%',
                          background: isSelected ? 'var(--accent-primary)' : pct > 0 ? 'var(--surface-tint)' : 'transparent',
                          border: isSelected ? 'none' : '1px solid var(--border-default)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.18s ease',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--accent-on-primary)' : pct > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {dayNum}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DashCard>

          {/* ── KPI cards ── */}
          <div className="hf-stats-grid">
            <KpiCard icon={<Target size={17} />} label="Active Habits" value={totalCount} sub="being tracked" />
            <KpiCard icon={<CheckCircle2 size={17} />} label={isViewingToday ? 'Completed Today' : 'Completed'} value={`${completedCount}/${totalCount}`} sub={`${todayPct}% complete`} />
            <KpiCard icon={<Flame size={17} />} label="Best Streak" value={stats?.bestStreak ?? 0} suffix="d" sub={stats?.bestStreakHabitName || 'start a streak'} />
            <KpiCard icon={<TrendingUp size={17} />} label="Weekly Avg" value={avgPct} suffix="%" sub="last 7 days" />
          </div>

          {/* ── 2-column widget grid ── */}
          <div className="hf-dashboard-grid">
            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 22px)', minWidth: 0 }}>
              <DashCard title="Weekly report" action={<span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{avgPct}% avg</span>}>
                <WeeklyReportChart
                  data={weekBars.map(({ date, dayLabel, dayNum, pct, isToday }) => ({ date, label: dayLabel, dayNum, pct, isToday }))}
                  avg={avgPct}
                />
              </DashCard>

              <DashCard
                title={isViewingToday ? "Today's Habits" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                action={
                  <span style={{ fontSize: 13, fontWeight: 600, color: loadingDate ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {loadingDate ? 'Loading…' : `${completedCount}/${totalCount} done`}
                  </span>
                }
              >
                {displayHabits.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed var(--border-default)', borderRadius: 14 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-muted)' }}>No habits yet.</p>
                    <button
                      onClick={() => setAddOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--accent-primary)', color: 'var(--accent-on-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <Plus size={15} strokeWidth={2.6} /> Add your first habit
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {displayHabits.map((h, i) => (
                      <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} />
                    ))}
                  </div>
                )}
              </DashCard>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 22px)', minWidth: 0 }}>
              <DashCard
                title="Consistency score"
                action={avgPct > 0 ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{avgPct}%</span> : null}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 5 }}>
                    {weekBars.map(({ date, dayLabel, dayNum, pct, isToday }, i) => {
                      const TRACK_H = 88;
                      const barH = Math.max(pct > 0 ? 8 : 0, Math.round((pct / 100) * TRACK_H));
                      return (
                        <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <div style={{
                            width: '100%', height: TRACK_H, borderRadius: 10,
                            background: 'var(--surface-tint)',
                            position: 'relative', overflow: 'hidden',
                          }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: barH }}
                              transition={{ duration: 0.5, delay: 0.08 + i * 0.05, ease: 'easeOut' }}
                              style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                borderRadius: '8px 8px 0 0',
                                background: isToday
                                  ? 'var(--accent-primary)'
                                  : 'color-mix(in srgb, var(--accent-primary) 52%, transparent)',
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: 9, fontWeight: 500, color: isToday ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {dayLabel}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {dayNum}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {avgPct > 0 && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0,
                      top: 88 - Math.round((avgPct / 100) * 88),
                      borderTop: '1.5px dashed var(--border-medium)',
                      pointerEvents: 'none', zIndex: 2,
                    }}>
                      <span style={{
                        position: 'absolute', left: 0, top: -9,
                        fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                        background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4,
                      }}>
                        Avg.{avgPct}%
                      </span>
                    </div>
                  )}
                </div>
              </DashCard>

              {isViewingToday && <CircularProgress completed={completedCount} total={totalCount} />}

              <DashCard
                title="Bad Habits"
                action={
                  displayBadHabits.length > 0 ? (
                    <span style={{ fontSize: 13, fontWeight: 600, color: loadingDate ? 'var(--text-muted)' : RED_SOFT }}>
                      {loadingDate ? 'Loading…' : `${avoidedCount}/${displayBadHabits.length} avoided`}
                    </span>
                  ) : (
                    <button
                      onClick={() => { setAddBadDefault(true); setAddOpen(true); }}
                      style={{
                        padding: '5px 12px', borderRadius: 10, border: 'none',
                        background: RED_LIGHT, color: RED_SOFT,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <Plus size={13} /> Add
                    </button>
                  )
                }
              >
                {displayBadHabits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 12px 8px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: RED_LIGHT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}>
                      <Ban size={22} color={RED_SOFT} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>No bad habits tracked</p>
                    <p style={{ margin: '0 0 16px', fontSize: 12, color: TEXT_MUTED, lineHeight: 1.4 }}>
                      Add habits you want to break — check off each day you resist them
                    </p>
                    <button
                      onClick={() => { setAddBadDefault(true); setAddOpen(true); }}
                      style={{
                        padding: '9px 20px', borderRadius: 12, border: 'none',
                        background: RED, color: '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 2px 10px rgba(248,113,113,0.35)',
                      }}
                    >
                      <Plus size={14} /> Track a bad habit
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {displayBadHabits.map((h, i) => (
                      <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} bad />
                    ))}
                  </div>
                )}
              </DashCard>
            </div>
          </div>

          {/* Trip Planner section removed from habit dashboard */}

        </div>
      </div>

      {/* Responsive: hide button label on tiny phones */}
      <style>{`
        @media (max-width: 479px) { .hf-dash-btn-label { display: none; } }
      `}</style>

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
            initialBad={addBadDefault}
            onSuccess={handleAddSuccess}
            onClose={() => { setAddOpen(false); setAddBadDefault(false); }}
          />
        )}
      </AnimatePresence>

      {/* ProfileMenu instantiation removed */}

      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </div>
  );
}
