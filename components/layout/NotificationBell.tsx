'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Clock, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { todayString } from '@/lib/utils/dates';

interface Notice {
  id: string;
  title: string;
  description: string;
  icon: 'reminder' | 'streak';
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = todayString();
        const [habitsRes, entriesRes] = await Promise.all([
          supabase
            .from('habits')
            .select('id, name, reminder_time, current_streak')
            .eq('user_id', user.id)
            .eq('is_archived', false),
          supabase
            .from('habit_entries')
            .select('habit_id, is_completed')
            .eq('user_id', user.id)
            .eq('entry_date', today),
        ]);

        const habits = habitsRes.data ?? [];
        const done = new Set(
          (entriesRes.data ?? [])
            .filter((e) => e.is_completed)
            .map((e) => e.habit_id as string)
        );

        const notices: Notice[] = [];

        for (const h of habits) {
          if (!done.has(h.id) && h.reminder_time) {
            notices.push({
              id: `r-${h.id}`,
              title: `Reminder: ${h.name}`,
              description: `Scheduled at ${h.reminder_time}`,
              icon: 'reminder',
            });
          }
        }

        const topStreak = habits
          .filter((h) => (h.current_streak ?? 0) >= 3)
          .sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))[0];

        if (topStreak) {
          notices.push({
            id: `s-${topStreak.id}`,
            title: `${topStreak.current_streak}-day streak on ${topStreak.name}`,
            description: 'Keep the fire burning today.',
            icon: 'streak',
          });
        }

        if (!cancelled) setItems(notices);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  const count = items.length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          width: 34,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 9,
          border: '1px solid var(--border-default)',
          background: open ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
        }}
      >
        <Bell size={15} />
        {count > 0 && (
          <span
            aria-label={`${count} new`}
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              minWidth: 14,
              height: 14,
              padding: '0 3px',
              borderRadius: 7,
              background: '#F43F5E',
              color: '#fff',
              fontSize: 9.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 320,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              padding: 8,
              zIndex: 50,
            }}
          >
            <div
              style={{
                padding: '6px 8px 10px',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Notifications
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {loading ? 'Loading…' : `${count} new`}
              </span>
            </div>

            {!loading && items.length === 0 && (
              <div
                style={{
                  padding: '28px 12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                You&apos;re all caught up.
              </div>
            )}

            {!loading &&
              items.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '9px 10px',
                    borderRadius: 9,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background:
                        n.icon === 'streak' ? 'rgba(245,158,11,0.14)' : 'var(--accent-glow)',
                      border: `1px solid ${n.icon === 'streak' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.25)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: n.icon === 'streak' ? '#F59E0B' : 'var(--accent-primary)',
                    }}
                  >
                    {n.icon === 'streak' ? <Flame size={13} /> : <Clock size={13} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {n.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      {n.description}
                    </p>
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
