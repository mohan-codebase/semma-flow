'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { HabitWithEntry } from '@/types/habit';

const MOVE_RED   = '#FF375F';
const MOVE_TRACK = 'rgba(255,55,95,0.18)';
const FONT       = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface ActivityDetailProps {
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  totalCompletions: number;
  bestStreak: number;
  weekPct: number;
  today: string;
}

// ─── Big Ring ─────────────────────────────────────────────────────────────────
function BigRing({ pct, size = 300 }: { pct: number; size?: number }) {
  const stroke  = 40;
  const radius  = (size - stroke) / 2;
  const circ    = 2 * Math.PI * radius;
  const clamped = Math.min(pct, 100);
  const offset  = circ - (clamped / 100) * circ;
  const center  = size / 2;

  const ang  = (clamped / 100) * 360 - 90;
  const rad  = (ang * Math.PI) / 180;
  const ax   = Math.round((center + radius * Math.cos(rad)) * 1000) / 1000;
  const ay   = Math.round((center + radius * Math.sin(rad)) * 1000) / 1000;
  const aRot = Math.round((ang + 90) * 1000) / 1000;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="bigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B8A" />
          <stop offset="100%" stopColor={MOVE_RED} />
        </linearGradient>
        {/* shadow filter for the ring */}
        <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* dark track */}
      <circle cx={center} cy={center} r={radius} fill="none" stroke={MOVE_TRACK} strokeWidth={stroke} />
      {/* progress arc */}
      <motion.circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke="url(#bigGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        filter="url(#ringGlow)"
      />
      {/* arrow at leading edge */}
      {clamped > 3 && (
        <g transform={`translate(${ax},${ay}) rotate(${aRot})`}>
          <circle r={stroke / 2 + 2} fill="#000" />
          <circle r={stroke / 2} fill={MOVE_RED} />
          <path d="M -7 4 L 0 -7 L 7 4" fill="none" stroke="white"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

// ─── Mini Ring ────────────────────────────────────────────────────────────────
function MiniRing({ pct, size = 38 }: { pct: number; size?: number }) {
  const stroke  = 4;
  const radius  = (size - stroke) / 2;
  const circ    = 2 * Math.PI * radius;
  const clamped = Math.min(pct, 100);
  const offset  = circ - (clamped / 100) * circ;
  const center  = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke={MOVE_TRACK} strokeWidth={stroke} />
      <motion.circle
        cx={center} cy={center} r={radius}
        fill="none" stroke={MOVE_RED}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
    </svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function ActivityBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max    = Math.max(...data, 1);
  const chartH = 72;
  // 4 evenly-spaced time-style labels (like Apple's 12:00 6:00 12:00 6:00)
  const sparseLabels = labels.map((l, i) =>
    i === 0 || i === 2 || i === 4 || i === 6 ? l : ''
  );

  return (
    <div>
      {/* dotted reference line at 50% */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: chartH * 0.5,
          left: 0, right: 0,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,55,95,0.55)', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            50%
          </span>
          <div style={{ flex: 1, borderTop: '1px dashed rgba(255,55,95,0.28)' }} />
        </div>

        {/* bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: chartH }}>
          {data.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: v > 0 ? Math.max(4, (v / max) * chartH) : 3,
                background: v > 0
                  ? `linear-gradient(180deg, rgba(255,107,138,0.9) 0%, ${MOVE_RED} 100%)`
                  : 'rgba(255,55,95,0.1)',
                borderRadius: '3px 3px 0 0',
              }}
            />
          ))}
        </div>
      </div>

      {/* labels */}
      <div style={{ display: 'flex', marginTop: 5 }}>
        {sparseLabels.map((l, i) => (
          <div key={i} style={{ flex: 1 }}>
            {l && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>
                {l}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 0.5, background: 'rgba(255,255,255,0.1)' }} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ActivityDetail({
  habits,
  weekData,
  totalCompletions,
  bestStreak,
  weekPct,
}: ActivityDetailProps) {
  const router = useRouter();

  const goodHabits     = habits.filter((h) => !h.is_bad_habit);
  const completedToday = goodHabits.filter((h) => h.todayEntry?.is_completed).length;
  const totalToday     = goodHabits.length;
  const todayPct       = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const barData  = weekData.map((d) => d.percentage);
  const dayNames = weekData.map((d) => {
    const date = new Date(d.date + 'T12:00:00');
    return ['S','M','T','W','T','F','S'][date.getDay()];
  });

  const headerDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{ background: '#000', minHeight: '100dvh', fontFamily: FONT }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        padding: '12px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        {/* back */}
        <button
          onClick={() => router.back()}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* date */}
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', flex: 1, textAlign: 'center' }}>
          {headerDate}
        </span>

        {/* right actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {[
            // calendar icon
            <svg key="cal" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="12" rx="2.5" stroke="#fff" strokeWidth="1.5" />
              <path d="M5 1v3M11 1v3M2 7h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>,
            // share icon
            <svg key="share" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v9M5 4l3-3 3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 10v4h10v-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>,
          ].map((icon, i) => (
            <button
              key={i}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* ── Week mini rings ── */}
        <div style={{ padding: '14px 16px 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {weekData.map((day, i) => {
              const isToday = day.isToday;
              const letter  = dayNames[i];
              return (
                <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  {/* day letter with pink circle for today */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: isToday ? MOVE_RED : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? '#fff' : 'rgba(255,255,255,0.45)',
                      lineHeight: 1,
                    }}>
                      {letter}
                    </span>
                  </div>
                  <MiniRing pct={day.percentage} size={38} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Big Ring ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 20px' }}
        >
          <BigRing pct={todayPct} size={300} />
        </motion.div>

        {/* ── Move / stats ── */}
        <div style={{ padding: '0 20px' }}>

          <p style={{ fontSize: 17, fontWeight: 500, color: '#fff', margin: '0 0 2px' }}>Move</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <p style={{ margin: 0 }}>
              <span style={{ fontSize: 46, fontWeight: 700, color: MOVE_RED, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {completedToday}/{totalToday}
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: MOVE_RED, marginLeft: 6, letterSpacing: '0.01em' }}>
                HABITS
              </span>
            </p>
            {/* goal-edit circle button */}
            <button
              style={{
                width: 38, height: 38, borderRadius: '50%',
                border: `2px solid ${MOVE_RED}`,
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
              onClick={() => router.push('/dashboard/habits')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7.5" stroke={MOVE_RED} strokeWidth="1.5" />
                <path d="M9 5.5v7M5.5 9h7" stroke={MOVE_RED} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <ActivityBarChart data={barData} labels={dayNames} />

          <p style={{ fontSize: 12, fontWeight: 700, color: MOVE_RED, margin: '10px 0 0', letterSpacing: '0.05em' }}>
            TOTAL {totalCompletions.toLocaleString()} COMPLETIONS
          </p>
        </div>

        {/* ── Streak | Week% ── */}
        <div style={{ margin: '22px 0 0' }}>
          <Divider />
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, padding: '18px 20px' }}>
              <p style={{ fontSize: 15, fontWeight: 400, color: '#fff', margin: '0 0 2px' }}>Streak</p>
              <p style={{ margin: 0 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                  {bestStreak}
                </span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>days</span>
              </p>
            </div>
            <div style={{ width: 0.5, background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch', margin: '14px 0' }} />
            <div style={{ flex: 1, padding: '18px 20px' }}>
              <p style={{ fontSize: 15, fontWeight: 400, color: '#fff', margin: '0 0 2px' }}>This Week</p>
              <p style={{ margin: 0 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                  {weekPct}
                </span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>%</span>
              </p>
            </div>
          </div>
          <Divider />
        </div>

        {/* ── Individual habits (like "Stairs Climbed") ── */}
        <div style={{ marginBottom: 24 }}>
          {goodHabits.map((habit, i) => {
            const done = habit.todayEntry?.is_completed ?? false;
            return (
              <React.Fragment key={habit.id}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push('/dashboard/habits')}
                >
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 400, color: '#fff', margin: '0 0 1px' }}>
                      {habit.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                      {habit.current_streak > 0
                        ? `${habit.current_streak} day streak`
                        : 'No streak yet'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 28, fontWeight: 700,
                      color: done ? '#fff' : 'rgba(255,255,255,0.2)',
                      letterSpacing: '-0.02em',
                    }}>
                      {done ? (habit.current_streak > 0 ? habit.current_streak : '✓') : '—'}
                    </span>
                    {done && (
                      <svg width="8" height="8" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="4" fill={MOVE_RED} />
                      </svg>
                    )}
                  </div>
                </div>
                {i < goodHabits.length - 1 && (
                  <div style={{ height: 0.5, background: 'rgba(255,255,255,0.07)', marginLeft: 20 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </div>
  );
}
