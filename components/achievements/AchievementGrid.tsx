'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AchievementCard from './AchievementCard';
import type { AchievementDef } from '@/types/achievement';
import EmptyState from '@/components/ui/EmptyState';

interface AchievementCardData extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressMax: number;
  progressPct: number;
}

interface Props {
  achievements: AchievementCardData[];
}

type FilterTab = 'all' | 'unlocked' | 'locked';

export default function AchievementGrid({ achievements }: Props) {
  const [filter, setFilter] = useState<FilterTab>('all');

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const lockedCount = achievements.filter((a) => !a.unlocked).length;

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: achievements.length },
    { key: 'unlocked', label: 'Unlocked', count: unlockedCount },
    { key: 'locked', label: 'Locked', count: lockedCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter tabs + summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map(({ key, label, count }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: active ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border-subtle)',
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 20,
                    background: active ? 'rgba(16,185,129,0.2)' : 'var(--bg-tertiary)',
                    color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <span style={{ color: '#EAB308', fontWeight: 700, fontFamily: "'IBM Plex Mono'" }}>{unlockedCount}</span>
          {' / '}
          {achievements.length} earned
        </span>
      </div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {filtered.map((achievement) => (
          <motion.div
            key={achievement.type}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
          >
            <AchievementCard achievement={achievement} />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <EmptyState
            emoji={filter === 'unlocked' ? '🏆' : '🔓'}
            title={filter === 'unlocked' ? 'No badges yet' : 'All achievements unlocked!'}
            description={
              filter === 'unlocked'
                ? 'Keep building streaks and completing habits — your first badge is closer than you think.'
                : 'You\'ve unlocked everything. Absolute legend.'
            }
            accentColor="#EAB308"
            compact
          />
        </div>
      )}
    </div>
  );
}
