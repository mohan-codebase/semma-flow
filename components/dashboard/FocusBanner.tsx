'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Target, ArrowRight, Check, Flame, Clock } from 'lucide-react';
import type { HabitWithEntry } from '@/types/habit';
import { todayString } from '@/lib/utils/dates';

interface FocusBannerProps {
  habits: HabitWithEntry[];
}

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
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export default function FocusBanner({ habits }: FocusBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tick, setTick] = useState(msUntilMidnight());
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReady(true);
    const id = setInterval(() => setTick(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleCheckIn = async (habitId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habitId,
          entry_date: todayString(),
          is_completed: true,
        }),
      });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Priority: highest current_streak among incomplete; fallback first incomplete
  const target = habits
    .filter((h) => !h.todayEntry?.is_completed)
    .sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))[0];

  const total   = habits.length;
  const done    = habits.filter((h) => h.todayEntry?.is_completed).length;
  const allDone = total > 0 && done === total;

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'relative',
        background: allDone
          ? 'linear-gradient(135deg, rgba(16,229,176,0.18) 0%, rgba(91,199,218,0.12) 100%)'
          : 'var(--bg-card)',
        border: `1px solid ${allDone ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-xl)',
        padding: 'var(--space-4) var(--space-5)',
        overflow: 'hidden',
        boxShadow: 'var(--glass-highlight), var(--shadow-xs)',
      }}
    >
      {/* Subtle spotlight */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: allDone
            ? 'radial-gradient(circle, rgba(16,229,176,0.22) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139,127,232,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--r-md)',
            background: allDone ? 'var(--accent-glow-lg)' : 'var(--bg-tertiary)',
            border: `1px solid ${allDone ? 'var(--border-accent)' : 'var(--border-default)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: allDone ? 'var(--accent-light)' : 'var(--text-secondary)',
          }}
        >
          {allDone ? <Check size={20} strokeWidth={2.4} /> : <Target size={20} strokeWidth={2} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {allDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: "'Outfit'",
                    letterSpacing: '-0.02em',
                  }}
                >
                  All done today.
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {done}/{total} habits completed · see you tomorrow.
                </p>
              </motion.div>
            ) : target ? (
              <motion.div
                key={target.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span className="eyebrow" style={{ letterSpacing: '0.12em' }}>Focus next</span>
                  {(target.current_streak ?? 0) >= 3 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: 'var(--warm-glow)',
                        border: '1px solid rgba(244,183,64,0.26)',
                        color: 'var(--warm)',
                        fontSize: 10.5,
                        fontWeight: 600,
                      }}
                    >
                      <Flame size={9} />
                      {target.current_streak}d streak
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: "'Outfit'",
                    letterSpacing: '-0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {target.name}
                </p>
                <p
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: '-0.005em',
                  }}
                >
                  <Clock size={11} />
                  {ready ? formatCountdown(tick) : '—'} left today
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {!allDone && target && (
          <button
            onClick={() => handleCheckIn(target.id)}
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 'var(--r-md)',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--cyan) 100%)',
              color: 'var(--accent-on-primary)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 2px 8px rgba(16,229,176,0.22)',
              transition: 'filter 0.15s, transform 0.15s, box-shadow 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.filter = '';
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
          >
            Check in
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
