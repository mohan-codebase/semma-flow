'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { OverviewStats } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';

// ─── Apple Fitness exact palette ─────────────────────────────────────────────
const MOVE_RED    = '#FF375F';
const MOVE_TRACK  = 'rgba(255,55,95,0.2)';
const PURPLE      = '#BF5AF2';
const BLUE        = '#32ADE6';
const GREEN       = '#32D74B';
const CARD_BG     = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const CARD_RADIUS = 14;
const FONT        = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface FitnessSummaryProps {
  stats: OverviewStats | null;
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  displayName?: string;
  initials?: string;
}

// ─── Activity Ring ────────────────────────────────────────────────────────────
function ActivityRing({ pct, size = 130 }: { pct: number; size?: number }) {
  const stroke   = 18;
  const radius   = (size - stroke) / 2;
  const circ     = 2 * Math.PI * radius;
  const clamped  = Math.min(pct, 100);
  const offset   = circ - (clamped / 100) * circ;
  const center   = size / 2;

  // arrow tip coords — rounded to avoid SSR/client float mismatch
  const ang  = (clamped / 100) * 360 - 90;
  const rad  = (ang * Math.PI) / 180;
  const ax   = Math.round((center + radius * Math.cos(rad)) * 1000) / 1000;
  const ay   = Math.round((center + radius * Math.sin(rad)) * 1000) / 1000;
  const aRot = Math.round((ang + 90) * 1000) / 1000;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id="smRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B8A" />
          <stop offset="100%" stopColor={MOVE_RED} />
        </linearGradient>
      </defs>
      {/* track */}
      <circle cx={center} cy={center} r={radius} fill="none" stroke={MOVE_TRACK} strokeWidth={stroke} />
      {/* arc */}
      <motion.circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke="url(#smRingGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
      {/* arrow */}
      {clamped > 5 && (
        <g transform={`translate(${ax},${ay}) rotate(${aRot})`}>
          <circle r={stroke / 2} fill={MOVE_RED} />
          <path d="M -4 2 L 0 -5 L 4 2" fill="none" stroke="white"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

// ─── Mini bar chart (7 bars) ──────────────────────────────────────────────────
function BarChart({ data, color, labels }: { data: number[]; color: string; labels: string[] }) {
  const max    = Math.max(...data, 1);
  const chartH = 52;
  // show only first, middle-ish, and last 2 labels like Apple
  const sparse = labels.map((l, i) => (i === 0 || i === 3 || i === 6 ? l : ''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: chartH }}>
        {data.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: Math.max(3, (v / max) * chartH),
              background: color,
              borderRadius: '2px 2px 0 0',
              opacity: v === 0 ? 0.18 : 0.85,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        {sparse.map((l, i) => (
          <div key={i} style={{ flex: 1 }}>
            {l && (
              <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>
                {l}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────
function Card({ children, onClick, style }: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      style={{
        background:   CARD_BG,
        border:       `0.5px solid ${CARD_BORDER}`,
        borderRadius: CARD_RADIUS,
        cursor:       onClick ? 'pointer' : 'default',
        overflow:     'hidden',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Card header row ──────────────────────────────────────────────────────────
function CardHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: FONT, letterSpacing: '-0.01em' }}>
        {title}
      </span>
      {/* Apple-style gray chevron */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.28)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── Award ring SVG (metallic silver) ────────────────────────────────────────
function AwardRing({ size = 68 }: { size?: number }) {
  const s = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="awOuter" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#D1D1D6" />
          <stop offset="60%" stopColor="#8E8E93" />
          <stop offset="100%" stopColor="#636366" />
        </radialGradient>
        <radialGradient id="awInner" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#48484A" />
          <stop offset="100%" stopColor="#1C1C1E" />
        </radialGradient>
        {/* red arc on the award */}
        <linearGradient id="awRedArc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={MOVE_RED} />
          <stop offset="100%" stopColor="#FF6B8A" />
        </linearGradient>
      </defs>
      {/* outer ring */}
      <circle cx={s} cy={s} r={s - 3} fill="url(#awOuter)" />
      {/* inner dark circle */}
      <circle cx={s} cy={s} r={s - 11} fill="url(#awInner)" />
      {/* red arc on top of ring */}
      <circle
        cx={s} cy={s}
        r={s - 7}
        fill="none"
        stroke="url(#awRedArc)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * (s - 7) * 0.7} ${2 * Math.PI * (s - 7)}`}
        strokeDashoffset={`${-2 * Math.PI * (s - 7) * 0.15}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
      {/* center dot */}
      <circle cx={s} cy={s} r={3} fill={MOVE_RED} opacity={0.8} />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FitnessSummary({
  stats,
  habits,
  weekData,
  initials = '?',
}: FitnessSummaryProps) {
  const router = useRouter();

  const goodHabits = habits.filter((h) => !h.is_bad_habit);
  const completedToday = goodHabits.filter((h) => h.todayEntry?.is_completed).length;
  const totalToday     = goodHabits.length;
  const todayPct       = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const barData  = weekData.map((d) => d.percentage);
  const dayNames = weekData.map((d) => {
    const date = new Date(d.date + 'T12:00:00');
    return ['S','M','T','W','T','F','S'][date.getDay()];
  });

  const bestHabit = [...goodHabits].sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))[0];
  const todayDate = new Date();
  const dateStr   = todayDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const sessionDate = todayDate.toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  }).replace(/\//g, '/');

  return (
    <div
      style={{
        background: '#000',
        minHeight: '100dvh',
        fontFamily: FONT,
        padding: '0 0 8px',
      }}
    >
      {/* ── Page content max-width wrapper ── */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Summary
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '3px 0 0', letterSpacing: '-0.01em' }}>
              {dateStr}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings')}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0, marginTop: 4,
              fontFamily: FONT,
            }}
          >
            {initials}
          </button>
        </div>

        {/* ── Activity Ring card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card onClick={() => router.push('/dashboard/activity')} style={{ padding: '14px 16px 16px', marginBottom: 10 }}>
            <CardHeader title="Activity Ring" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 4 }}>
              <ActivityRing pct={todayPct} size={130} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', margin: '0 0 2px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Move
                </p>
                <p style={{ margin: 0 }}>
                  <span style={{ fontSize: 38, fontWeight: 700, color: MOVE_RED, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {completedToday}/{totalToday}
                  </span>
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: MOVE_RED, margin: '2px 0 0', letterSpacing: '0.04em' }}>
                  HABITS
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── 2×2 grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Streak / "Step Count" equivalent */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 }}>
            <Card onClick={() => router.push('/dashboard/activity')} style={{ padding: '14px 14px 14px' }}>
              <CardHeader title="Best Streak" />
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', margin: '2px 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Today
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: PURPLE, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {stats?.bestStreak ?? 0}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: PURPLE, marginLeft: 3 }}>d</span>
              </p>
              <BarChart data={barData} color={PURPLE} labels={dayNames} />
            </Card>
          </motion.div>

          {/* Week % / "Step Distance" equivalent */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <Card onClick={() => router.push('/dashboard/analytics')} style={{ padding: '14px 14px 14px' }}>
              <CardHeader title="This Week" />
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', margin: '2px 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Today
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: BLUE, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {stats?.weekPercentage ?? 0}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: BLUE, marginLeft: 2 }}>%</span>
              </p>
              <BarChart data={barData} color={BLUE} labels={dayNames} />
            </Card>
          </motion.div>

          {/* Sessions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }}>
            <Card onClick={() => router.push('/dashboard/habits')} style={{ padding: '14px 14px 16px' }}>
              <CardHeader title="Sessions" />
              {/* Mindfulness-style icon */}
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(48,215,75,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 8,
              }}>
                🌿
              </div>
              {bestHabit ? (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bestHabit.name}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: GREEN, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {bestHabit.current_streak}
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', marginLeft: 3 }}>DAY</span>
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{sessionDate}</p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>No habits yet</p>
              )}
            </Card>
          </motion.div>

          {/* Awards */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}>
            <Card onClick={() => router.push('/dashboard/achievements')} style={{ padding: '14px 14px 16px' }}>
              <CardHeader title="Awards" />
              <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 10px' }}>
                <AwardRing size={72} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px', textAlign: 'center' }}>
                {stats && stats.totalCompletions >= 100 ? 'Streak Master' : 'New Move Record'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center' }}>
                {(stats?.totalCompletions ?? 0).toLocaleString()} completions
              </p>
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
