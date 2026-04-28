'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Activity, CheckCircle2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export interface ActivityItem {
  entry_id:   string;
  habit_id:   string;
  habit_name: string;
  habit_icon: string;
  habit_color: string;
  completed_at: string;   // ISO timestamp
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
}

function ActivitySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="shimmer" style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="shimmer" style={{ height: 12, width: '60%', borderRadius: 4, marginBottom: 6 }} />
            <div className="shimmer" style={{ height: 10, width: '30%', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DynamicIcon({ name, size = 14, color }: { name: string; size?: number; color: string }) {
  const pascal = name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }> | undefined>)[pascal];
  return Icon ? <Icon size={size} color={color} /> : <CheckCircle2 size={size} color={color} />;
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <section
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--space-4) var(--space-4) var(--space-3)',
        boxShadow: 'var(--glass-highlight), var(--shadow-xs)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
        <Activity size={13} color="var(--accent-light)" />
        <span className="eyebrow" style={{ letterSpacing: '0.12em' }}>Recent activity</span>
      </div>

      {loading ? (
        <ActivitySkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          emoji="✅"
          title="No activity yet"
          description="Complete a habit today and it'll show up here. Your journey is just beginning."
          accentColor="var(--accent-primary)"
          compact
        />
      ) : (
        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
          {/* Vertical rail */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 13,
              top: 4,
              bottom: 4,
              width: 1,
              background: 'var(--border-subtle)',
            }}
          />

          {items.slice(0, 10).map((it, i) => (
            <motion.li
              key={it.entry_id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 4px 6px 0',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: `${it.habit_color}22`,
                  border: `1px solid ${it.habit_color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                <DynamicIcon name={it.habit_icon} size={13} color={it.habit_color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {it.habit_name}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: '-0.005em',
                    marginTop: 1,
                  }}
                  title={format(parseISO(it.completed_at), 'PPpp')}
                >
                  {formatDistanceToNow(parseISO(it.completed_at), { addSuffix: true })}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  );
}
