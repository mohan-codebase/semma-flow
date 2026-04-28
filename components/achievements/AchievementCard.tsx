'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Lock } from 'lucide-react';
import type { AchievementDef } from '@/types/achievement';
import { format } from 'date-fns';

interface AchievementCardData extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressMax: number;
  progressPct: number;
}

interface Props {
  achievement: AchievementCardData;
  onNewUnlock?: boolean;
}

const RARITY_STYLES: Record<string, { border: string; glow: string; label: string }> = {
  common:    { border: 'rgba(148,163,184,0.2)',   glow: 'rgba(148,163,184,0.05)', label: '#94A3B8' },
  rare:      { border: 'rgba(59,130,246,0.3)',    glow: 'rgba(59,130,246,0.06)',  label: '#3B82F6' },
  epic:      { border: 'rgba(139,92,246,0.35)',   glow: 'rgba(139,92,246,0.08)',  label: '#8B5CF6' },
  legendary: { border: 'rgba(234,179,8,0.4)',     glow: 'rgba(234,179,8,0.1)',    label: '#EAB308' },
};

function DynamicIcon({ name, size = 22, color }: { name: string; size?: number; color: string }) {
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

export default function AchievementCard({ achievement, onNewUnlock = false }: Props) {
  const rarityStyle = RARITY_STYLES[achievement.rarity] ?? RARITY_STYLES.common;
  const isUnlocked = achievement.unlocked;

  return (
    <motion.div
      initial={onNewUnlock ? { scale: 0.8, opacity: 0 } : false}
      animate={onNewUnlock ? { scale: 1, opacity: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      style={{
        background: isUnlocked
          ? `radial-gradient(ellipse at top left, ${rarityStyle.glow}, var(--bg-tertiary))`
          : 'var(--bg-glass)',
        border: `1px solid ${isUnlocked ? rarityStyle.border : 'var(--border-subtle)'}`,
        borderRadius: 16,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: isUnlocked ? 1 : 0.55,
        filter: isUnlocked ? 'none' : 'grayscale(0.6)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isUnlocked ? `0 0 24px ${rarityStyle.glow}` : 'none',
      }}
      whileHover={isUnlocked ? { y: -2, boxShadow: `0 8px 32px ${rarityStyle.glow}` } : { opacity: 0.7 }}
    >
      {/* Rarity badge */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: rarityStyle.label,
          fontFamily: "'IBM Plex Sans'",
          padding: '2px 6px',
          background: `${rarityStyle.glow}`,
          border: `1px solid ${rarityStyle.border}`,
          borderRadius: 20,
        }}
      >
        {achievement.rarity}
      </div>

      {/* Icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: isUnlocked
            ? `radial-gradient(circle, ${achievement.color}22, ${achievement.color}08)`
            : 'var(--bg-tertiary)',
          border: isUnlocked
            ? `1px solid ${achievement.color}44`
            : '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isUnlocked ? `0 0 20px ${achievement.color}33` : 'none',
        }}
      >
        {isUnlocked ? (
          <DynamicIcon name={achievement.icon} size={24} color={achievement.color} />
        ) : (
          <Lock size={20} color="var(--text-muted)" />
        )}
      </div>

      {/* Title + description */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 14,
            fontWeight: 700,
            color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontFamily: "'Outfit'",
          }}
        >
          {achievement.title}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {achievement.description}
        </p>
      </div>

      {/* Progress or unlocked date */}
      {isUnlocked ? (
        achievement.unlockedAt && (
          <p style={{ margin: 0, fontSize: 11, color: rarityStyle.label, fontFamily: "'IBM Plex Mono'" }}>
            Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
          </p>
        )
      ) : (
        achievement.progressMax > 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}>
                {achievement.progress} / {achievement.progressMax}
              </span>
            </div>
            <div
              style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${achievement.progressPct}%`,
                  background: achievement.color,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        )
      )}
    </motion.div>
  );
}
