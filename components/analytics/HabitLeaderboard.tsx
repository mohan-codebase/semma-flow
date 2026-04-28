'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Flame } from 'lucide-react';
import type { HabitLeaderboardItem } from '@/types/analytics';

interface Props {
  data: HabitLeaderboardItem[];
}

function DynamicIcon({ name, size = 16, color }: { name: string; size?: number; color: string }) {
  const pascalName = name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[pascalName];
  if (IconComponent) return <IconComponent size={size} color={color} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill={color} opacity={0.6} />
    </svg>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return `rgba(16,185,129,${alpha})`;
  const s = hex.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export default function HabitLeaderboard({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
        No habit data yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((item, index) => (
        <motion.div
          key={item.habitId}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04, duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}
        >
          {/* Rank */}
          <span
            style={{
              width: 24,
              fontSize: 12,
              fontWeight: 700,
              color: index === 0 ? '#EAB308' : index === 1 ? '#94A3B8' : index === 2 ? '#F97316' : 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono'",
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>

          {/* Icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: hexToRgba(item.habitColor, 0.12),
              border: `1px solid ${hexToRgba(item.habitColor, 0.25)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DynamicIcon name={item.habitIcon} size={15} color={item.habitColor} />
          </div>

          {/* Name + bar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.habitName}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: item.habitColor, fontFamily: "'IBM Plex Mono'", flexShrink: 0, marginLeft: 8 }}>
                {item.completionRate}%
              </span>
            </div>
            <div
              style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.completionRate}%` }}
                transition={{ delay: index * 0.04 + 0.2, duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', background: item.habitColor, borderRadius: 2 }}
              />
            </div>
          </div>

          {/* Streak */}
          {item.streak > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                flexShrink: 0,
                padding: '2px 8px',
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 20,
              }}
            >
              <Flame size={11} color="#F59E0B" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', fontFamily: "'IBM Plex Mono'" }}>
                {item.streak}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
