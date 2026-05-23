'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import type { OverviewStats } from '@/types/analytics';
import type { HabitWithEntry, Habit } from '@/types/habit';

function DynamicIcon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const pascal = (name ?? 'circle-check')
    .split(/[-_]/)
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icons = LucideIcons as any;
  const Comp = icons[pascal] ?? icons['Circle'];
  return <Comp size={size} color={color} strokeWidth={2} />;
}

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

const RADIUS = 72;
const STROKE = 10;
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
        padding: '24px 20px',
        background: 'var(--surface-card)',
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Today's Progress
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
            {completed} of {total} done
          </p>
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: 20,
          background: pct === 100 ? 'rgba(124,58,237,0.12)' : PURPLE_LIGHT,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE }}>{pct}%</span>
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
            stroke={PURPLE_LIGHT}
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={RADIUS}
            fill="none"
            stroke={pct === 100 ? PURPLE_HEX : 'url(#progressGrad)'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>
        {/* Centre label */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {pct}%
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            complete
          </span>
        </div>
      </div>

      {/* Per-habit dots */}
      {total > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
          {Array.from({ length: total }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: 0.6 + i * 0.05 }}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i < completed ? PURPLE : PURPLE_LIGHT,
                border: `2px solid ${i < completed ? PURPLE : 'var(--drag-handle)'}`,
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
        background: done ? PURPLE_MID : PURPLE_LIGHT,
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
      background: accent ? 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(168,85,247,0.08))' : 'var(--surface-card)',
      border: `1px solid ${accent ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.08)'}`,
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
}: {
  habit: HabitWithEntry;
  onClose: () => void;
  onUpdate: (updated: Partial<HabitWithEntry> & { id: string }) => void;
}) {
  const [entries, setEntries] = useState<{ entry_date: string; is_completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editMode, setEditMode]   = useState(false);
  const [editName, setEditName]   = useState(habit.name);
  const [editIcon, setEditIcon]   = useState(habit.icon ?? 'circle-check');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const rate = Math.round((completedCount / 30) * 100);

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
        style={{ position: 'fixed', inset: 0, background: 'rgba(30,27,75,0.55)', backdropFilter: 'blur(4px)', zIndex: 200 }}
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
          background: 'var(--bg-primary)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '88dvh',
          overflowY: 'auto',
          padding: '0 20px 52px',
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: '0 -8px 40px rgba(30,27,75,0.18)',
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
                  background: 'var(--surface-card)', border: `1.5px solid ${PURPLE}`,
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
          <div style={{ background: 'var(--surface-card)', borderRadius: 18, padding: '16px', marginBottom: 16, boxShadow: '0 1px 6px rgba(124,58,237,0.07)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Choose icon
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 16 }}>
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
        <div style={{ background: 'var(--surface-card)', borderRadius: 18, padding: '16px 14px', marginBottom: 14 }}>
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
        <div style={{ background: 'var(--surface-card)', borderRadius: 18, padding: '16px' }}>
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
    <div style={{ background: 'var(--surface-card)', borderRadius: 18, padding: '16px 16px', marginBottom: 14, boxShadow: '0 1px 6px rgba(124,58,237,0.07)' }}>
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
        style={{ position: 'fixed', inset: 0, background: 'rgba(30,27,75,0.55)', backdropFilter: 'blur(4px)', zIndex: 200 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
          zIndex: 201, background: 'var(--bg-primary)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92dvh', overflowY: 'auto',
          padding: '0 16px 44px',
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: '0 -8px 40px rgba(30,27,75,0.18)',
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
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 18,
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        background: isDark
          ? 'linear-gradient(160deg, rgba(10,6,28,0.82) 0%, rgba(20,10,50,0.78) 100%)'
          : 'linear-gradient(160deg, rgba(220,210,255,0.48) 0%, rgba(240,235,255,0.38) 100%)',
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflowY: 'auto',
      }}
    >
      {/* Inner centred column */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 48px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 8 }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(60,40,120,0.70)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Profile
          </p>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)',
            boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(124,58,237,0.12)',
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
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
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
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
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
          <button onClick={toggleTheme} style={{
            width: 58, height: 32, borderRadius: 999, border: 'none',
            cursor: 'pointer', position: 'relative', flexShrink: 0,
            padding: 0,
            /* liquid glass track */
            background: isDark
              ? 'linear-gradient(135deg, rgba(124,58,237,0.55) 0%, rgba(167,85,247,0.35) 100%)'
              : 'linear-gradient(135deg, rgba(196,181,253,0.45) 0%, rgba(221,214,254,0.30) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isDark
              ? '0 0 0 1px rgba(167,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 16px rgba(124,58,237,0.45)'
              : '0 0 0 1px rgba(196,181,253,0.6), inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(124,58,237,0.15)',
            transition: 'all 0.3s ease',
          }}>
            {/* Glass thumb */}
            <div style={{
              position: 'absolute', top: 4, left: isDark ? 28 : 4,
              width: 24, height: 24, borderRadius: '50%',
              background: isDark
                ? 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(237,233,254,0.85) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.80) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
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
            </div>
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
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
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
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
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
        <p style={{ margin: 'auto 0 0', paddingTop: 32, textAlign: 'center', fontSize: 11, color: TEXT_MUTED }}>
          Semma Flow · v1.0
        </p>
      </div>
    </motion.div>
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
  const [localHabits, setLocalHabits] = useState<HabitWithEntry[]>(habits);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [addOpen, setAddOpen]         = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);

  const handleAddSuccess = (saved: Habit) => {
    setLocalHabits((prev) => [...prev, { ...saved, todayEntry: null, completionRate: 0 } as HabitWithEntry]);
    setAddOpen(false);
  };

  const handleUpdate = (updated: Partial<HabitWithEntry> & { id: string }) => {
    setLocalHabits((prev) => prev.map((h) => h.id === updated.id ? { ...h, ...updated } : h));
  };

  const goodHabits   = localHabits.filter((h) => !h.is_bad_habit);
  const completedCount = goodHabits.filter((h) => h.todayEntry?.is_completed).length;
  const totalCount     = goodHabits.length;
  const todayPct       = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const weekPct        = stats?.weekPercentage ?? 0;
  const prevWeekDiff   = weekPct >= 0 ? `+${Math.min(weekPct, 12)}%` : `${weekPct}%`;

  // Header date
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  // Day labels for weekly card
  // Mon-first order: 1=Mon…6=Sat, 0=Sun
  const MON_FIRST_DOW = [1, 2, 3, 4, 5, 6, 0];
  const DAY_SHORT     = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayDow      = now.getDay();

  // For each Mon-first slot, find the matching weekData entry
  const weekBars = MON_FIRST_DOW.map((dow) => {
    const entry = weekData.find((d) => new Date(d.date + 'T00:00:00').getDay() === dow);
    return { dow, pct: entry?.percentage ?? 0, isToday: entry?.isToday ?? false };
  });

  const handleToggle = async (id: string, currentDone: boolean) => {
    setLocalHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              todayEntry: {
                ...(h.todayEntry ?? {}),
                habit_id: id,
                is_completed: !currentDone,
              } as HabitWithEntry['todayEntry'],
            }
          : h
      )
    );
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: id, is_completed: !currentDone }),
      });
    } catch {
      // revert on failure
      setLocalHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                todayEntry: {
                  ...(h.todayEntry ?? {}),
                  habit_id: id,
                  is_completed: currentDone,
                } as HabitWithEntry['todayEntry'],
              }
            : h
        )
      );
    }
  };

  const bestInsight =
    completedCount === totalCount && totalCount > 0
      ? `All ${totalCount} habits done today. Excellent streak!`
      : stats?.weekPercentage && stats.weekPercentage >= 80
        ? `You're ${stats.weekPercentage}% consistent this week. Keep it up!`
        : `${totalCount - completedCount} habit${totalCount - completedCount !== 1 ? 's' : ''} left today — you've got this.`;

  return (
    <div style={{
      background: 'var(--bg-primary)',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: 32,
      overflowX: 'hidden',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingTop: 20,
            paddingBottom: 4,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
              {dateStr}
            </p>
            <h1 style={{
              margin: '4px 0 0',
              fontSize: 28,
              fontWeight: 800,
              color: TEXT_DARK,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}>
              Hi, {displayName.split(' ')[0]}!
            </h1>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `linear-gradient(135deg, ${PURPLE} 0%, #A855F7 100%)`,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 700,
              marginTop: 8, flexShrink: 0,
              boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
            }}
          >
            {initials}
          </button>
        </motion.div>

        {/* ── Weekly Analytics Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          style={{
            marginTop: 20,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #7C3AED 0%, #9F67FF 60%, #B794F4 100%)',
            padding: '20px 20px 16px',
            boxShadow: '0 8px 28px rgba(124,58,237,0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circle */}
          <div style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Weekly Analytics
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                Goal: 90% completion
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 20,
              padding: '5px 10px',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {todayPct >= 80 ? '+' : ''}{todayPct}% today
              </span>
            </div>
          </div>

          {/* Day labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 28,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}>
            {weekBars.map(({ dow, pct, isToday }, i) => {
              const barH = Math.max(4, Math.round((pct / 100) * 32));
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {/* bar track */}
                  <div style={{ width: 6, height: 32, borderRadius: 3, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: barH,
                      borderRadius: 3,
                      background: pct > 0
                        ? `rgba(255,255,255,${0.45 + (pct / 100) * 0.55})`
                        : 'transparent',
                      transition: 'height 0.4s ease',
                    }} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? '#fff' : 'rgba(255,255,255,0.55)',
                    letterSpacing: '0.02em',
                  }}>
                    {DAY_SHORT[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Today's Habits ── */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
              Today's Habits
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: PURPLE }}>
                {completedCount}/{totalCount} done
              </span>
              <button
                onClick={() => setAddOpen(true)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: PURPLE, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                  fontSize: 22, fontWeight: 400, lineHeight: 1,
                  boxShadow: '0 3px 10px rgba(124,58,237,0.4)',
                  flexShrink: 0,
                }}
              >
                +
              </button>
            </div>
          </div>

          {goodHabits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '32px 20px',
                background: 'var(--surface-card)',
                borderRadius: 18,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontSize: 15, color: TEXT_MUTED }}>No habits yet.</p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {goodHabits.map((h, i) => (
                <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} />
              ))}
            </div>
          )}
        </div>

        {/* ── Circular Progress ── */}
        <CircularProgress completed={completedCount} total={totalCount} />

        {/* ── Insight Card ── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            style={{
              marginTop: 20,
              padding: '16px 18px',
              background: 'var(--surface-card)',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: PURPLE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3L13.5 8.5L19.5 9.3L15 13.5L16.2 19.5L11 16.5L5.8 19.5L7 13.5L2.5 9.3L8.5 8.5L11 3Z"
                  fill="white" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: PURPLE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                New Insight
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, color: TEXT_DARK, lineHeight: 1.4 }}>
                {bestInsight}
              </p>
            </div>
          </motion.div>
        )}

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
