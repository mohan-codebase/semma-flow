'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { todayString, toLocalDateString } from '@/lib/utils/dates';
import { useRealtimeEntries } from '@/lib/hooks/useRealtimeEntries';

type Snapshot = {
  todayDone: number;
  todayTotal: number;
  bestStreak: number;
  bestStreakName: string;
  spark: number[]; // last 14 days, count per day
};

const EMPTY: Snapshot = {
  todayDone: 0,
  todayTotal: 0,
  bestStreak: 0,
  bestStreakName: '',
  spark: Array(14).fill(0),
};

function msUntilMidnight(): number {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  return mid.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

export default function SidebarPulse() {
  const [userId, setUserId] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(msUntilMidnight());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTick(msUntilMidnight()), 30000);
    return () => clearInterval(id);
  }, []);

  const today = todayString();

  const loadSnapshot = useMemo(
    () => async (uid: string) => {
      const supabase = createClient();

      const start = new Date();
      start.setDate(start.getDate() - 13);
      const startStr = toLocalDateString(start);

      const [habitsRes, todayEntriesRes, sparkEntriesRes] = await Promise.all([
        supabase
          .from('habits')
          .select('id, name, current_streak')
          .eq('user_id', uid)
          .eq('is_archived', false),
        supabase
          .from('habit_entries')
          .select('habit_id, is_completed')
          .eq('user_id', uid)
          .eq('entry_date', today),
        supabase
          .from('habit_entries')
          .select('entry_date, is_completed')
          .eq('user_id', uid)
          .eq('is_completed', true)
          .gte('entry_date', startStr)
          .lte('entry_date', today),
      ]);

      const habits = habitsRes.data ?? [];
      const todayEntries = todayEntriesRes.data ?? [];
      const sparkEntries = sparkEntriesRes.data ?? [];

      const best = habits.reduce(
        (acc: { current_streak: number; name: string } | null, h) =>
          !acc || (h.current_streak ?? 0) > acc.current_streak
            ? { current_streak: h.current_streak ?? 0, name: h.name }
            : acc,
        null
      );

      const counts = new Map<string, number>();
      for (const e of sparkEntries) {
        counts.set(e.entry_date, (counts.get(e.entry_date) ?? 0) + 1);
      }
      const spark: number[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        spark.push(counts.get(toLocalDateString(d)) ?? 0);
      }

      setSnap({
        todayDone: todayEntries.filter((e) => e.is_completed).length,
        todayTotal: habits.length,
        bestStreak: best?.current_streak ?? 0,
        bestStreakName: best?.name ?? '',
        spark,
      });
      setLoaded(true);
    },
    [today]
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) loadSnapshot(uid);
    });
  }, [loadSnapshot]);

  useRealtimeEntries({
    userId,
    entryDate: today,
    onEntryChange: () => {
      if (!userId) return;
      loadSnapshot(userId);
    },
  });

  // Also refresh when habits themselves change (add, edit, archive, delete),
  // since entry-only subscription misses new habits with no entry yet.
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`habits:sidebar:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => loadSnapshot(userId)
      )
      .subscribe();

    const refetch = () => loadSnapshot(userId);
    window.addEventListener('habitforge:habit-mutated', refetch);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('habitforge:habit-mutated', refetch);
    };
  }, [userId, loadSnapshot]);

  const pct = snap.todayTotal > 0 ? Math.round((snap.todayDone / snap.todayTotal) * 100) : 0;
  const sparkMax = Math.max(1, ...snap.spark);

  // Ring geometry
  const R = 22;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  return (
    <div
      style={{
        margin: '12px 12px 0',
        padding: 'var(--space-3) var(--space-3)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--glass-highlight)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: "'IBM Plex Mono', monospace",
            color: 'var(--text-muted)',
          }}
        >
          Today · Live
        </span>
        <span
          className={loaded ? 'glow-pulse' : undefined}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: loaded ? 'var(--accent-primary)' : 'var(--text-dimmed)',
            boxShadow: loaded ? '0 0 6px var(--accent-primary)' : 'none',
          }}
        />
      </div>

      {/* Ring + stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width={56} height={56} viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="sp-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--cyan)" />
            </linearGradient>
          </defs>
          <circle
            cx={28}
            cy={28}
            r={R}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth={4}
          />
          <motion.circle
            cx={28}
            cy={28}
            r={R}
            fill="none"
            stroke="url(#sp-ring)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - dash }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            transform="rotate(-90 28 28)"
          />
          <text
            x={28}
            y={31}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize={12.5}
            fontWeight={700}
            fontFamily="'Outfit'"
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
          >
            {pct}%
          </text>
        </svg>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: "'Outfit'",
              letterSpacing: '-0.01em',
              margin: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {snap.todayDone} / {snap.todayTotal}
          </p>
          <p
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10.5,
              color: 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '-0.005em',
              margin: 0,
            }}
          >
            <Clock size={10} />
            {mounted ? formatCountdown(tick) : '—'} left
          </p>
        </div>
      </div>

      {/* 14-day sparkline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2.5,
          height: 22,
          padding: '0 2px',
        }}
        title="Last 14 days"
      >
        {snap.spark.map((v, i) => {
          const h = Math.max(2, Math.round((v / sparkMax) * 22));
          const isToday = i === snap.spark.length - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: v === 0
                  ? 'var(--border-default)'
                  : isToday
                    ? 'var(--accent-primary)'
                    : 'var(--accent-glow-md)',
                border: v > 0 ? '1px solid rgba(16,229,176,0.35)' : 'none',
                boxShadow: isToday && v > 0 ? '0 0 4px var(--accent-primary)' : 'none',
                transition: 'height 0.3s ease',
              }}
            />
          );
        })}
      </div>

      {/* Streak chip */}
      {snap.bestStreak >= 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            borderRadius: 'var(--r-sm)',
            background: 'var(--warm-glow)',
            border: '1px solid rgba(244,183,64,0.22)',
          }}
          title={`${snap.bestStreakName}: ${snap.bestStreak} day streak`}
        >
          <Flame size={12} color="var(--warm)" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--warm)',
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '-0.005em',
            }}
          >
            {snap.bestStreak}d
          </span>
          <span
            style={{
              flex: 1,
              fontSize: 11,
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.005em',
            }}
          >
            {snap.bestStreakName || 'Best streak'}
          </span>
        </div>
      )}

      {/* Quick add button */}
      <button
        onClick={() => {
          if (typeof window === 'undefined') return;
          localStorage.setItem('habitforge_open_form', '1');
          window.dispatchEvent(new Event('habitforge:open-add'));
          if (window.location.pathname !== '/dashboard') {
            window.location.href = '/dashboard';
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '7px 10px',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          fontSize: 11.5,
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '-0.005em',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--accent-glow-md)';
          (e.currentTarget as HTMLElement).style.color = 'var(--accent-light)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
        }}
      >
        <Sparkles size={11} />
        Quick add
        <kbd
          className="hidden sm:inline-block"
          style={{
            marginLeft: 4,
            padding: '1px 5px',
            borderRadius: 4,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            fontSize: 9.5,
            fontFamily: "'IBM Plex Mono', monospace",
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
          }}
        >
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
