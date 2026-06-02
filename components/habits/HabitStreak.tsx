'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface HabitStreakProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { icon: 14, count: 14, label: 10, gap: 2, padding: '4px 8px' },
  md: { icon: 18, count: 18, label: 11, gap: 3, padding: '6px 10px' },
  lg: { icon: 22, count: 24, label: 12, gap: 4, padding: '8px 14px' },
};

function getStreakColor(streak: number): string {
  if (streak >= 7) return '#a6a6a6';   // amber
  if (streak > 3)  return '#898989';   // orange
  return 'var(--text-muted)';           // muted
}

export default function HabitStreak({ streak, size = 'md' }: HabitStreakProps) {
  const cfg = sizeConfig[size];
  const color = getStreakColor(streak);
  const isActive = streak > 0;
  const isGolden = streak >= 7;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: cfg.gap,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: cfg.gap + 2,
          padding: cfg.padding,
          borderRadius: 'var(--r-pill)',
          background: isActive
            ? `rgba(${isGolden ? '245,158,11' : streak > 3 ? '249,115,22' : '71,85,105'}, 0.12)`
            : 'transparent',
        }}
      >
        <span
          className={isActive ? 'fire-glow' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            color,
            flexShrink: 0,
          }}
        >
          <Flame size={cfg.icon} fill={isActive ? color : 'none'} />
        </span>

        <span
          className={isGolden ? 'glow-pulse' : ''}
          style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: cfg.count,
            fontWeight: 700,
            color,
            lineHeight: 1,
            minWidth: '1ch',
            textAlign: 'center',
          }}
        >
          {streak}
        </span>
      </div>

      <span
        style={{
          fontSize: cfg.label,
          color: 'var(--text-muted)',
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}
      >
        day streak
      </span>

      <style>{`
        @keyframes fire-glow-anim {
          0%, 100% {
            filter: 'none';
          }
          50% {
            filter: 'none';
          }
        }
        @keyframes glow-pulse-anim {
          0%, 100% {
            textShadow: 'none';
          }
          50% {
            textShadow: 'none';
          }
        }
        .fire-glow {
          animation: fire-glow-anim 2s ease-in-out infinite;
        }
        .glow-pulse {
          animation: glow-pulse-anim 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
