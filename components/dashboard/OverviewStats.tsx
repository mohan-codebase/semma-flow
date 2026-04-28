'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Flame, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import type { OverviewStats } from '@/types/analytics';

interface OverviewStatsProps {
  stats: OverviewStats | null;
  loading: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const mv  = useMotionValue(0);
  const out = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctrl = animate(mv, value, { duration: 1.1, ease: 'easeOut' });
    return ctrl.stop;
  }, [value, mv]);

  useEffect(() => {
    return out.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [out]);

  return <span ref={ref}>0</span>;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: '18px 20px',
        minHeight: 120,
      }}
    >
      <div className="shimmer" style={{ height: 10, width: '40%', borderRadius: 4, marginBottom: 18 }} />
      <div className="shimmer" style={{ height: 30, width: '55%', borderRadius: 6, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 10, width: '60%', borderRadius: 4 }} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: 10.5,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: 14,
};

const numStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: "'Outfit'",
  lineHeight: 1,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
};

const subStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  marginTop: 6,
  letterSpacing: '-0.005em',
};

function StatCard({
  delay,
  label,
  children,
  trend,
}: {
  delay: number;
  label: string;
  children: React.ReactNode;
  trend?: { value: number; positive: boolean } | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: '18px 20px 20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.18s ease, transform 0.18s ease',
        cursor: 'default',
        boxShadow: 'var(--glass-highlight), var(--shadow-xs)',
      }}
      whileHover={{
        y: -1,
        borderColor: 'var(--border-default)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ ...labelStyle, marginBottom: 0 }}>{label}</span>
        {trend && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10.5,
              fontWeight: 600,
              color: trend.positive ? 'var(--accent-light)' : 'var(--danger)',
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '-0.01em',
            }}
          >
            {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export default function OverviewStats({ stats, loading }: OverviewStatsProps) {
  if (loading || !stats) {
    return (
      <div className="hf-stats-grid">
        {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const todayPct = stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0;

  return (
    <div className="hf-stats-grid">
      {/* Today's Progress */}
      <StatCard delay={0} label="Today">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ProgressRing percentage={todayPct} size={56} strokeWidth={4} />
          <div>
            <p style={numStyle}>
              {stats.todayCompleted}
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-dimmed)', marginLeft: 2 }}>
                /{stats.todayTotal}
              </span>
            </p>
            <p style={subStyle}>completed</p>
          </div>
        </div>
      </StatCard>

      {/* Best Streak */}
      <StatCard delay={0.05} label="Best Streak">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--r-md)',
              background: 'var(--warm-glow)',
              border: '1px solid rgba(244,183,64,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Flame size={18} color="var(--warm)" strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={numStyle}>
              {stats.bestStreak}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dimmed)', marginLeft: 3 }}>d</span>
            </p>
            <p style={{ ...subStyle, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stats.bestStreakHabitName || 'No habits yet'}
            </p>
          </div>
        </div>
      </StatCard>

      {/* This Week */}
      <StatCard
        delay={0.1}
        label="This Week"
        trend={{ value: stats.weekPercentage, positive: stats.weekPercentage >= 50 }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <p style={numStyle}>{stats.weekPercentage}</p>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-dimmed)' }}>%</span>
        </div>
        <p style={subStyle}>7-day completion</p>
      </StatCard>

      {/* Total Completions */}
      <StatCard delay={0.15} label="All Time">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--r-md)',
              background: 'var(--indigo-glow)',
              border: '1px solid rgba(139,127,232,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} color="var(--indigo)" strokeWidth={2} />
          </div>
          <div>
            <p style={numStyle}>
              <AnimatedNumber value={stats.totalCompletions} />
            </p>
            <p style={subStyle}>total check-ins</p>
          </div>
        </div>
      </StatCard>
    </div>
  );
}
