'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart2, Calendar, Layers, Award } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import CompletionChart from '@/components/analytics/CompletionChart';
import CalendarHeatmap from '@/components/analytics/CalendarHeatmap';
import CategoryBreakdown from '@/components/analytics/CategoryBreakdown';
import WeekdayPatterns from '@/components/analytics/WeekdayPatterns';
import HabitLeaderboard from '@/components/analytics/HabitLeaderboard';
import Skeleton from '@/components/ui/Skeleton';
import type { DailyTrend, HeatmapCell, CategoryStat, WeekdayPattern, HabitLeaderboardItem } from '@/types/analytics';

interface PatternsData {
  weekdayPatterns: WeekdayPattern[];
  categoryBreakdown: CategoryStat[];
  leaderboard: HabitLeaderboardItem[];
}

function StatCard({
  label,
  value,
  sub,
  trend,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '20px 20px',
        }}
      >
        <Skeleton variant="text" />
        <div style={{ marginTop: 8 }}>
          <Skeleton variant="text" />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '20px 20px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans'" }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          {value}
        </span>
        {trend && (
          trend === 'up'
            ? <TrendingUp size={16} color="var(--accent-primary)" />
            : <TrendingDown size={16} color="var(--danger)" />
        )}
      </div>
      {sub && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</p>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children, loading }: { title: string; icon: React.ReactNode; children: React.ReactNode; loading?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '20px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          {title}
        </h2>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState(30);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [patterns, setPatterns] = useState<PatternsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const [trendsRes, heatmapRes, patternsRes] = await Promise.all([
        fetch(`/api/analytics/trends?days=${days}`),
        fetch('/api/analytics/heatmap?months=12'),
        fetch('/api/analytics/patterns?days=90'),
      ]);

      if (trendsRes.ok) {
        const { data } = await trendsRes.json() as { data: DailyTrend[] };
        setTrends(data ?? []);
      }
      if (heatmapRes.ok) {
        const { data } = await heatmapRes.json() as { data: HeatmapCell[] };
        setHeatmap(data ?? []);
      }
      if (patternsRes.ok) {
        const { data } = await patternsRes.json() as { data: PatternsData };
        setPatterns(data ?? null);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(trendDays);
  }, [fetchData, trendDays]);

  // Derive summary stats from trend data
  const avgCompletion = trends.length > 0
    ? Math.round(trends.reduce((s, d) => s + d.percentage, 0) / trends.length)
    : 0;

  const recentHalf = trends.slice(Math.floor(trends.length / 2));
  const earlierHalf = trends.slice(0, Math.floor(trends.length / 2));
  const recentAvg = recentHalf.length > 0
    ? recentHalf.reduce((s, d) => s + d.percentage, 0) / recentHalf.length
    : 0;
  const earlierAvg = earlierHalf.length > 0
    ? earlierHalf.reduce((s, d) => s + d.percentage, 0) / earlierHalf.length
    : 0;
  const trend = recentAvg > earlierAvg ? 'up' : recentAvg < earlierAvg ? 'down' : null;

  const bestDay = trends.length > 0
    ? trends.reduce((best, d) => (d.percentage > best.percentage ? d : best), trends[0])
    : null;

  const totalCompleted = trends.reduce((s, d) => s + d.completed, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="hf-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header */}
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          Analytics
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          Deep insights into your habit patterns
        </p>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14,
        }}
      >
        <StatCard
          label="Avg Completion"
          value={`${avgCompletion}%`}
          sub={`Last ${trendDays} days`}
          trend={trend}
          loading={loading}
        />
        <StatCard
          label="Total Completed"
          value={totalCompleted.toLocaleString()}
          sub={`Last ${trendDays} days`}
          loading={loading}
        />
        <StatCard
          label="Best Day"
          value={bestDay ? `${bestDay.percentage}%` : '—'}
          sub={(() => {
            if (!bestDay?.date) return '';
            const d = parseISO(bestDay.date);
            return isValid(d) ? format(d, 'MMM d, yyyy') : bestDay.date;
          })()}
          loading={loading}
        />
        <StatCard
          label="Habits Tracked"
          value={patterns?.leaderboard.length.toString() ?? '—'}
          sub="Active habits"
          loading={loading}
        />
      </div>

      {/* Completion trend */}
      <SectionCard title="Completion Trend" icon={<TrendingUp size={18} />} loading={loading}>
        <CompletionChart
          data={trends}
          currentRange={trendDays}
          onRangeChange={(days) => setTrendDays(days)}
        />
      </SectionCard>

      {/* Calendar heatmap */}
      <SectionCard title="Activity Heatmap" icon={<Calendar size={18} />} loading={loading}>
        <CalendarHeatmap data={heatmap} />
      </SectionCard>

      {/* Two-col: category + weekday */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        <SectionCard title="By Category" icon={<Layers size={18} />} loading={loading}>
          <CategoryBreakdown data={patterns?.categoryBreakdown ?? []} />
        </SectionCard>

        <SectionCard title="Weekday Patterns" icon={<BarChart2 size={18} />} loading={loading}>
          <WeekdayPatterns data={patterns?.weekdayPatterns ?? []} />
        </SectionCard>
      </div>

      {/* Leaderboard */}
      <SectionCard title="Habit Leaderboard" icon={<Award size={18} />} loading={loading}>
        <HabitLeaderboard data={patterns?.leaderboard ?? []} />
      </SectionCard>
    </motion.div>
  );
}
