'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus } from 'lucide-react';
import { DynamicIcon } from '@/lib/icons';
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
}

const PURPLE        = 'var(--accent-primary)';
const PURPLE_LIGHT  = 'var(--surface-tint)';
const PURPLE_MID    = 'var(--surface-tint-mid)';
const TEXT_DARK     = 'var(--text-primary)';
const TEXT_MUTED    = 'var(--text-muted)';
// Raw hex needed only for SVG attributes and rgba() calls
const PURPLE_HEX    = '#7C3AED';

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
}: {
  habit: HabitWithEntry;
  index: number;
  onToggle: (id: string, completed: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const done = habit.todayEntry?.is_completed ?? false;
  const icon = habit.icon ?? 'circle-check';

  const subtitle = habit.description
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
        ...(done ? GLASS_PURPLE : GLASS_SM),
        borderRadius: 18,
        cursor: 'pointer',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
      onClick={() => onOpen(habit.id)}
    >
      {/* Icon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        background: PURPLE_LIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        flexGrow: 0,
        overflow: 'hidden',
      }}>
        <DynamicIcon name={icon} size={22} color={PURPLE} />
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
          background: done ? PURPLE : 'transparent',
          border: `2px solid ${done ? PURPLE : 'var(--drag-handle)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s ease',
        }}
      >
        {done && <CheckIcon />}
      </div>
    </motion.div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      ...(accent ? GLASS_NESTED_PURPLE : GLASS_NESTED),
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: accent ? PURPLE : TEXT_DARK, letterSpacing: '-0.03em' }}>
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
  const [entries, setEntries] = useState<{ entry_date: string; is_completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editMode, setEditMode]     = useState(false);
  const [editName, setEditName]     = useState(habit.name);
  const [editIcon, setEditIcon]     = useState(habit.icon ?? 'circle-check');
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), icon: editIcon }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      onUpdate({ id: habit.id, name: editName.trim(), icon: editIcon });
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

  const todayDate  = new Date();
  const todayLocal = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;

  const displayDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + monthOffset, 1);
  const calYear  = displayDate.getFullYear();
  const calMonth = displayDate.getMonth();

  const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DOW_LABELS = ['S','M','T','W','T','F','S'];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow    = new Date(calYear, calMonth, 1).getDay();

  const entryMap = new Map(entries.map((e) => [e.entry_date, e.is_completed]));

  // Build padded calendar cells
  type CalCell = { date: string; day: number; completed: boolean; isToday: boolean; isFuture: boolean };
  const calCells: (CalCell | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const ds  = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      return { date: ds, day, completed: entryMap.get(ds) ?? false, isToday: ds === todayLocal, isFuture: ds > todayLocal };
    }),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  // Month-level stats for the visible month
  const monthPrefix   = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const monthEntries  = entries.filter((e) => e.entry_date.startsWith(monthPrefix));
  const monthDone     = monthEntries.filter((e) => e.is_completed).length;
  const isCurrentMon  = calYear === todayDate.getFullYear() && calMonth === todayDate.getMonth();
  const daysElapsed   = isCurrentMon ? todayDate.getDate() : daysInMonth;
  const monthRate     = daysElapsed > 0 ? Math.round((monthDone / daysElapsed) * 100) : 0;

  // For stat pills — last 30-day rate
  const completedCount = entries.filter((e) => e.is_completed).length;
  const rate = Math.min(100, Math.round((completedCount / 30) * 100));

  const canGoBack    = monthOffset > -3;
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

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
          zIndex: 201,
          background: 'var(--glass-bg-sheet)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '88dvh',
          overflowY: 'auto',
          padding: '0 20px 52px',
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: '0 -8px 48px rgba(30,27,75,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--drag-handle)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, marginBottom: 22 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(124,58,237,0.10)',
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
                onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditMode(true); }}
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
              Choose icon
            </p>
            <div className="hf-icon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 16 }}>
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
            {saveError && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#EF4444' }}>{saveError}</p>}
            <button
              onClick={saveEdit}
              disabled={saving}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                background: saving ? '#A78BFA' : PURPLE,
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: saving ? 'default' : 'pointer',
                boxShadow: '0 3px 12px rgba(124,58,237,0.35)',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Stat pills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <StatPill label="Current Streak" value={`${habit.current_streak}d`} accent />
          <StatPill label="Longest Streak" value={`${habit.longest_streak}d`} />
          <StatPill label="30-day Rate"    value={`${rate}%`} accent />
          <StatPill label="Total Done"     value={`${habit.total_completions}`} />
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
                      return (
                        <div key={di} style={{
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
                          transition: 'background 0.15s ease',
                        }}>
                          {cell.day}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div style={{ display: 'flex', gap: 14, marginTop: 10, justifyContent: 'center' }}>
                  {[
                    { bg: PURPLE,       label: 'Done',   txt: '#fff'    },
                    { bg: PURPLE_LIGHT, label: 'Missed', txt: TEXT_MUTED },
                    { bg: 'transparent',label: 'Today',  txt: PURPLE, border: `2px solid ${PURPLE}` },
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
              style={{ height: '100%', background: `linear-gradient(90deg,${PURPLE},#A855F7)`, borderRadius: 5 }}
            />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: TEXT_MUTED }}>
            {monthDone} of {daysElapsed} days completed
          </p>
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
    </>
  );
}

const HABIT_ICONS = [
  'circle-check','zap','flame','target','activity','award','trophy',
  'heart','smile','sun','moon','coffee','utensils','glass-water','apple',
  'dumbbell','footprints','bicycle','timer','clock','brain',
  'book-open','pen-tool','music','code','medal','star','shield',
  'droplets','leaf','palette','wallet','graduation-cap','headphones',
];
const HABIT_COLORS = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899'];
const DAY_LABELS   = ['S','M','T','W','T','F','S'];
const CHALLENGE_PRESETS = [7, 21, 30, 66, 90];

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
  const [name, setName]             = useState('');
  const [icon, setIcon]             = useState('circle-check');
  const [color, setColor]           = useState('#7C3AED');
  const [freqType, setFreqType]     = useState<FreqType>('daily');
  const [days, setDays]             = useState<number[]>([]);
  const [perWeek, setPerWeek]       = useState(3);
  const [targetType, setTargetType] = useState<TargetType>('boolean');
  const [duration, setDuration]     = useState(30);
  const [reminder, setReminder]     = useState('');
  const [challenge, setChallenge]   = useState<number | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

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
      if (reminder) body.reminder_time = reminder;
      if (challenge) body.challenge_days = challenge;

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
    { key: 'daily',     label: 'Every Day' },
    { key: 'weekly',    label: 'Specific Days' },
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
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
          zIndex: 201,
          background: 'var(--glass-bg-sheet)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92dvh', overflowY: 'auto',
          padding: '0 16px 44px',
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: '0 -8px 48px rgba(30,27,75,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--drag-handle)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 18 }}>
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
        </SectionCard>

        {/* ── Icon + Color ── */}
        <SectionCard>
          <FieldLabel>Icon</FieldLabel>
          <div className="hf-icon-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 18,
            maxHeight: 180, overflowY: 'auto', paddingRight: 2,
          }}>
            {HABIT_ICONS.map((ic) => {
              const active = icon === ic;
              return (
                <button key={ic} onClick={() => setIcon(ic)} title={ic} style={{
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
          <FieldLabel>Color</FieldLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            {HABIT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none',
                background: c, cursor: 'pointer', flexShrink: 0,
                boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                transition: 'all 0.15s', transform: color === c ? 'scale(1.15)' : 'scale(1)',
              }} />
            ))}
          </div>
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
            {(['boolean','duration'] as TargetType[]).map((t) => (
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

        {/* ── Challenge / Days to follow ── */}
        <SectionCard>
          <FieldLabel>Challenge duration (optional)</FieldLabel>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
            Set a goal for how many days to follow this habit.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CHALLENGE_PRESETS.map((d) => {
              const active = challenge === d;
              return (
                <button key={d} onClick={() => setChallenge(active ? null : d)} style={{
                  padding: '8px 16px', borderRadius: 20, border: 'none',
                  background: active ? color : '#F5F3FF',
                  color: active ? '#fff' : TEXT_DARK,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: active ? `0 2px 8px rgba(124,58,237,0.25)` : 'none',
                }}>{d} days</button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Reminder ── */}
        <SectionCard>
          <FieldLabel>Daily reminder (optional)</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DynamicIcon name="bell" size={20} color={TEXT_MUTED} />
            <input
              type="time"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              style={{
                ...inputStyle,
                width: 'auto', flex: 1,
                fontSize: 15, fontWeight: 600, color: reminder ? TEXT_DARK : TEXT_MUTED,
              }}
              onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
            />
            {reminder && (
              <button onClick={() => setReminder('')} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'var(--surface-tint)', color: TEXT_MUTED, fontSize: 16,
                cursor: 'pointer', flexShrink: 0,
              }}>×</button>
            )}
          </div>
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
            background: loading ? '#A78BFA' : `linear-gradient(135deg, ${color} 0%, #9F67FF 100%)`,
            color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            transition: 'all 0.15s',
          }}
        >
          {loading ? 'Saving…' : challenge ? `Start ${challenge}-Day Challenge` : 'Create Habit'}
        </button>
      </motion.div>
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
    return (localStorage.getItem('semma_flow_theme') ?? 'dark') !== 'light';
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

  const menuItems = [
    { icon: 'bell',        label: 'Notifications',  sub: 'Reminders & alerts' },
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
            <div style={{ width: 40, height: 4, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(124,58,237,0.18)' }} />
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
              boxShadow: '0 6px 20px rgba(124,58,237,0.4)',
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
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            style={{
              // Transparent hit-target wrapper. The global mobile rule forces a
              // ≥36px min-height on buttons; keeping the visual pill in an inner
              // element lets the tap area grow without stretching the track (which
              // previously inflated to 44px and shoved the thumb off-centre).
              border: 'none', background: 'transparent', padding: 0, margin: 0,
              cursor: 'pointer', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* liquid glass track */}
            <span style={{
              display: 'block', position: 'relative',
              width: 58, height: 32, borderRadius: 999,
              background: isDark
                ? 'linear-gradient(135deg, rgba(124,58,237,0.55) 0%, rgba(167,85,247,0.35) 100%)'
                : 'linear-gradient(135deg, rgba(196,181,253,0.45) 0%, rgba(221,214,254,0.30) 100%)',
              boxShadow: isDark
                ? '0 0 0 1px rgba(167,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 16px rgba(124,58,237,0.45)'
                : '0 0 0 1px rgba(196,181,253,0.6), inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(124,58,237,0.15)',
              transition: 'all 0.3s ease',
            }}>
              {/* Glass thumb */}
              <span style={{
                position: 'absolute', top: 4, left: isDark ? 30 : 4,
                width: 24, height: 24, borderRadius: '50%',
                background: isDark
                  ? 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(237,233,254,0.85) 100%)'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.80) 100%)',
                boxShadow: isDark
                  ? '0 0 0 1px rgba(255,255,255,0.25), 0 2px 8px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.9)'
                  : '0 0 0 1px rgba(196,181,253,0.4), 0 2px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DynamicIcon
                  name={isDark ? 'moon' : 'sun'}
                  size={12}
                  color={isDark ? PURPLE_HEX : '#F59E0B'}
                />
              </span>
            </span>
          </button>
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
          {menuItems.map(({ icon, label, sub }, idx) => (
            <div key={label}>
              {idx > 0 && <div style={{ height: 1, background: 'rgba(124,58,237,0.06)', marginLeft: 62 }} />}
              <button style={{
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

        {/* Version */}
        <p style={{ paddingTop: 32, textAlign: 'center', fontSize: 11, color: TEXT_MUTED, margin: 0 }}>
          Semma Flow · v1.0
        </p>
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
}: FitnessSummaryProps) {
  const [localHabits, setLocalHabits]   = useState<HabitWithEntry[]>(habits);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [addOpen, setAddOpen]           = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [dateEntries, setDateEntries]   = useState<Record<string, boolean>>({});
  const [loadingDate, setLoadingDate]   = useState(false);

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
    } catch {}
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
  const totalCount     = displayHabits.length;
  const todayPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const now     = new Date();
  const hour    = now.getHours();
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
