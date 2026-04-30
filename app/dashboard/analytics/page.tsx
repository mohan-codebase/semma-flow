import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { toLocalDateString } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';
import { TrendingUp, TrendingDown, BarChart2, Calendar, Layers, Award } from 'lucide-react';
import type { DailyTrend, HeatmapCell, CategoryStat, WeekdayPattern, HabitLeaderboardItem } from '@/types/analytics';
import CompletionChart from '@/components/analytics/CompletionChart';
import CalendarHeatmap from '@/components/analytics/CalendarHeatmap';
import CategoryBreakdown from '@/components/analytics/CategoryBreakdown';
import WeekdayPatterns from '@/components/analytics/WeekdayPatterns';
import HabitLeaderboard from '@/components/analytics/HabitLeaderboard';
import Skeleton from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Server-side data fetching (deduplicated via React cache)
// ---------------------------------------------------------------------------

async function getProfile() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, timezone: 'Asia/Kolkata' as string };
  const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle();
  return { user, timezone: profile?.timezone ?? 'Asia/Kolkata' };
}

async function fetchTrends(days: number, userTz: string, userId: string): Promise<DailyTrend[]> {
  const supabase = await createServerClient();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = formatInTimeZone(startDate, userTz, 'yyyy-MM-dd');
  const todayStr = formatInTimeZone(today, userTz, 'yyyy-MM-dd');

  const [{ data: habits }, { data: entries }] = await Promise.all([
    supabase.from('habits').select('id').eq('user_id', userId).eq('is_archived', false),
    supabase.from('habit_entries').select('entry_date, is_completed').eq('user_id', userId).gte('entry_date', startStr).lte('entry_date', todayStr),
  ]);

  const habitCount = (habits ?? []).length;
  const byDate = new Map<string, { completed: number; total: number }>();
  for (const e of entries ?? []) {
    const slot = byDate.get(e.entry_date) ?? { completed: 0, total: 0 };
    slot.total += 1;
    if (e.is_completed) slot.completed += 1;
    byDate.set(e.entry_date, slot);
  }

  const result: DailyTrend[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatInTimeZone(d, userTz, 'yyyy-MM-dd');
    const slot = byDate.get(dateStr);
    const completed = slot?.completed ?? 0;
    result.push({
      date: dateStr,
      completed,
      total: habitCount,
      percentage: habitCount > 0 ? Math.round((completed / habitCount) * 100) : 0,
    });
  }
  return result;
}

async function fetchHeatmap(months: number, userTz: string, userId: string): Promise<HeatmapCell[]> {
  const supabase = await createServerClient();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  const startStr = formatInTimeZone(startDate, userTz, 'yyyy-MM-dd');
  const todayStr = formatInTimeZone(today, userTz, 'yyyy-MM-dd');

  const [{ data: entries }, { data: habits }] = await Promise.all([
    supabase.from('habit_entries').select('entry_date, is_completed, habit_id').eq('user_id', userId).gte('entry_date', startStr).lte('entry_date', todayStr),
    supabase.from('habits').select('id').eq('user_id', userId).eq('is_archived', false),
  ]);

  const habitCount = (habits ?? []).length;
  const byDate = new Map<string, { completed: number; total: number }>();
  for (const e of entries ?? []) {
    const slot = byDate.get(e.entry_date) ?? { completed: 0, total: 0 };
    slot.total += 1;
    if (e.is_completed) slot.completed += 1;
    byDate.set(e.entry_date, slot);
  }

  const result: HeatmapCell[] = [];
  const cur = new Date(startDate);
  while (cur <= today) {
    const dateStr = formatInTimeZone(cur, userTz, 'yyyy-MM-dd');
    const slot = byDate.get(dateStr);
    result.push({
      date: dateStr,
      count: slot?.completed ?? 0,
      percentage: habitCount > 0 && slot ? Math.round((slot.completed / habitCount) * 100) : 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

interface PatternsData {
  weekdayPatterns: WeekdayPattern[];
  categoryBreakdown: CategoryStat[];
  leaderboard: HabitLeaderboardItem[];
}

async function fetchPatterns(days: number, userTz: string, userId: string): Promise<PatternsData> {
  const supabase = await createServerClient();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = formatInTimeZone(startDate, userTz, 'yyyy-MM-dd');
  const todayStr = formatInTimeZone(today, userTz, 'yyyy-MM-dd');

  const [{ data: entries }, { data: habits }] = await Promise.all([
    supabase.from('habit_entries').select('entry_date, is_completed, habit_id').eq('user_id', userId).gte('entry_date', startStr).lte('entry_date', todayStr),
    supabase.from('habits').select('id, name, icon, color, current_streak, category:categories(name, color)').eq('user_id', userId).eq('is_archived', false),
  ]);

  // Weekday patterns
  const weekdayMap = Array.from({ length: 7 }, (_, i) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
    dayIndex: i,
    completionRate: 0,
    totalEntries: 0,
    completedEntries: 0,
  }));
  for (const e of entries ?? []) {
    const dow = new Date(e.entry_date + 'T00:00:00').getDay();
    weekdayMap[dow].totalEntries += 1;
    if (e.is_completed) weekdayMap[dow].completedEntries += 1;
  }
  const weekdayPatterns = weekdayMap.map(({ completedEntries, totalEntries, ...rest }) => ({
    ...rest,
    completionRate: totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0,
    totalEntries,
  }));

  // Category breakdown
  const habitCategoryMap = new Map<string, { name: string; color: string }>();
  for (const h of habits ?? []) {
    const catRaw = h.category as unknown;
    const cat = (catRaw && typeof catRaw === 'object' && !Array.isArray(catRaw))
      ? (catRaw as { name: string; color: string })
      : null;
    habitCategoryMap.set(h.id, cat ?? { name: 'Uncategorized', color: '#10E5B0' });
  }
  const categoryMap = new Map<string, { color: string; completed: number; total: number }>();
  for (const e of entries ?? []) {
    const cat = habitCategoryMap.get(e.habit_id) ?? { name: 'Uncategorized', color: '#10E5B0' };
    const slot = categoryMap.get(cat.name) ?? { color: cat.color, completed: 0, total: 0 };
    slot.total += 1;
    if (e.is_completed) slot.completed += 1;
    categoryMap.set(cat.name, slot);
  }
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, { color, completed, total }]) => ({
    category,
    color,
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  })).sort((a, b) => b.percentage - a.percentage);

  // Leaderboard (last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const thirtyDaysAgoStr = formatInTimeZone(thirtyDaysAgo, userTz, 'yyyy-MM-dd');
  const { data: recentEntries } = await supabase
    .from('habit_entries')
    .select('habit_id, is_completed')
    .eq('user_id', userId)
    .gte('entry_date', thirtyDaysAgoStr)
    .lte('entry_date', todayStr);

  const leaderMap = new Map<string, { completed: number; total: number }>();
  for (const e of recentEntries ?? []) {
    const slot = leaderMap.get(e.habit_id) ?? { completed: 0, total: 0 };
    slot.total += 1;
    if (e.is_completed) slot.completed += 1;
    leaderMap.set(e.habit_id, slot);
  }
  const leaderboard = (habits ?? []).map((h) => {
    const slot = leaderMap.get(h.id) ?? { completed: 0, total: 0 };
    return {
      habitId: h.id,
      habitName: h.name,
      habitIcon: h.icon,
      habitColor: h.color,
      completionRate: slot.total > 0 ? Math.round((slot.completed / slot.total) * 100) : 0,
      streak: h.current_streak,
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  return { weekdayPatterns, categoryBreakdown, leaderboard };
}

// ---------------------------------------------------------------------------
// Streaming sections
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px 20px' }}>
      <Skeleton variant="text" />
      <div style={{ marginTop: 8 }}><Skeleton variant="text" /></div>
    </div>
  );
}

function SectionSkeleton({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton variant="text" /><Skeleton variant="text" /><Skeleton variant="text" />
      </div>
    </div>
  );
}

async function TrendsSection({ userId, timezone }: { userId: string; timezone: string }) {
  const trends = await fetchTrends(30, timezone, userId);
  return <CompletionChart data={trends} currentRange={30} />;
}

async function HeatmapSection({ userId, timezone }: { userId: string; timezone: string }) {
  const heatmap = await fetchHeatmap(12, timezone, userId);
  return <CalendarHeatmap data={heatmap} />;
}

async function CategorySection({ userId, timezone }: { userId: string; timezone: string }) {
  const patterns = await fetchPatterns(90, timezone, userId);
  return <CategoryBreakdown data={patterns.categoryBreakdown} />;
}

async function WeekdaySection({ userId, timezone }: { userId: string; timezone: string }) {
  const patterns = await fetchPatterns(90, timezone, userId);
  return <WeekdayPatterns data={patterns.weekdayPatterns} />;
}

async function LeaderboardSection({ userId, timezone }: { userId: string; timezone: string }) {
  const patterns = await fetchPatterns(90, timezone, userId);
  return <HabitLeaderboard data={patterns.leaderboard} />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AnalyticsPage() {
  const { user, timezone } = await getProfile();

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>Analytics</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Sign in to view analytics.</p>
      </div>
    );
  }

  // Pre-fetch summary stats for the stat cards (fastest query)
  const trends = await fetchTrends(30, timezone, user.id);
  const avgCompletion = trends.length > 0 ? Math.round(trends.reduce((s, d) => s + d.percentage, 0) / trends.length) : 0;
  const recentHalf = trends.slice(Math.floor(trends.length / 2));
  const earlierHalf = trends.slice(0, Math.floor(trends.length / 2));
  const recentAvg = recentHalf.length > 0 ? recentHalf.reduce((s, d) => s + d.percentage, 0) / recentHalf.length : 0;
  const earlierAvg = earlierHalf.length > 0 ? earlierHalf.reduce((s, d) => s + d.percentage, 0) / earlierHalf.length : 0;
  const trend = recentAvg > earlierAvg ? 'up' as const : recentAvg < earlierAvg ? 'down' as const : null;
  const bestDay = trends.length > 0 ? trends.reduce((best, d) => (d.percentage > best.percentage ? d : best), trends[0]) : null;
  const totalCompleted = trends.reduce((s, d) => s + d.completed, 0);

  return (
    <div className="hf-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          Analytics
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          Deep insights into your habit patterns
        </p>
      </div>

      {/* Summary stats — rendered immediately from pre-fetched data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} sub="Last 30 days" trend={trend} />
        <StatCard label="Total Completed" value={totalCompleted.toLocaleString()} sub="Last 30 days" />
        <StatCard
          label="Best Day"
          value={bestDay ? `${bestDay.percentage}%` : '—'}
          sub={bestDay?.date ? new Date(bestDay.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
        />
        <Suspense fallback={<StatCardSkeleton />}>
          <HabitsTrackedCard userId={user.id} timezone={timezone} />
        </Suspense>
      </div>

      {/* Completion trend — streamed */}
      <SectionCard title="Completion Trend" icon={<TrendingUp size={18} />}>
        <Suspense fallback={<SectionSkeleton title="Completion Trend" icon={<TrendingUp size={18} />} />}>
          <TrendsSection userId={user.id} timezone={timezone} />
        </Suspense>
      </SectionCard>

      {/* Calendar heatmap — streamed */}
      <SectionCard title="Activity Heatmap" icon={<Calendar size={18} />}>
        <Suspense fallback={<SectionSkeleton title="Activity Heatmap" icon={<Calendar size={18} />} />}>
          <HeatmapSection userId={user.id} timezone={timezone} />
        </Suspense>
      </SectionCard>

      {/* Two-col: category + weekday — streamed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        <SectionCard title="By Category" icon={<Layers size={18} />}>
          <Suspense fallback={<SectionSkeleton title="By Category" icon={<Layers size={18} />} />}>
            <CategorySection userId={user.id} timezone={timezone} />
          </Suspense>
        </SectionCard>

        <SectionCard title="Weekday Patterns" icon={<BarChart2 size={18} />}>
          <Suspense fallback={<SectionSkeleton title="Weekday Patterns" icon={<BarChart2 size={18} />} />}>
            <WeekdaySection userId={user.id} timezone={timezone} />
          </Suspense>
        </SectionCard>
      </div>

      {/* Leaderboard — streamed */}
      <SectionCard title="Habit Leaderboard" icon={<Award size={18} />}>
        <Suspense fallback={<SectionSkeleton title="Habit Leaderboard" icon={<Award size={18} />} />}>
          <LeaderboardSection userId={user.id} timezone={timezone} />
        </Suspense>
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client-free stat card (pure server component)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | null;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  return (
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px 20px' }}>
      <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans'" }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          {value}
        </span>
        {TrendIcon && <TrendIcon size={16} color="var(--accent-primary)" />}
      </div>
      {sub && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</p>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

async function HabitsTrackedCard({ userId, timezone }: { userId: string; timezone: string }) {
  const patterns = await fetchPatterns(90, timezone, userId);
  return (
    <StatCard
      label="Habits Tracked"
      value={patterns.leaderboard.length.toString()}
      sub="Active habits"
    />
  );
}
