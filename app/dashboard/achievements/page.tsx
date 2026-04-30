'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import AchievementGrid from '@/components/achievements/AchievementGrid';
import Skeleton from '@/components/ui/Skeleton';
import type { AchievementDef } from '@/types/achievement';

interface AchievementCardData extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressMax: number;
  progressPct: number;
}

function SkeletonGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 14,
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 16,
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Skeleton variant="circle" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      ))}
    </div>
  );
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // First check for new achievements
        const checkRes = await fetch('/api/achievements/check', { method: 'POST' });
        if (checkRes.ok) {
          const { data } = await checkRes.json() as { data: { newlyUnlocked: Array<{ type: string }>; count: number } };
          if ((data?.count ?? 0) > 0) {
            setNewlyUnlocked((data.newlyUnlocked ?? []).map((a) => a.type));
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3500);
          }
        }

        // Then fetch all achievements
        const res = await fetch('/api/achievements');
        if (res.ok) {
          const { data } = await res.json() as { data: AchievementCardData[] };
          setAchievements(data ?? []);
        }
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div
      className="hf-page page-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* New achievement celebration banner */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(234,179,8,0.05))',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: 16,
              boxShadow: '0 0 40px rgba(234,179,8,0.1)',
            }}
          >
            <Sparkles size={20} color="#EAB308" />
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#EAB308', fontFamily: "'Outfit'" }}>
                New Achievement{newlyUnlocked.length > 1 ? 's' : ''} Unlocked!
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                You earned {newlyUnlocked.length} new badge{newlyUnlocked.length > 1 ? 's' : ''} — keep it up!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
            Achievements
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
            Milestones and badges earned on your journey
          </p>
        </div>
        {!loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: 12,
            }}
          >
            <Trophy size={16} color="#EAB308" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#EAB308', fontFamily: "'IBM Plex Mono'" }}>
              {unlockedCount} / {achievements.length}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? <SkeletonGrid /> : <AchievementGrid achievements={achievements} />}
    </div>
  );
}
