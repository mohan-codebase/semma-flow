import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { todayString, toLocalDateString } from '@/lib/utils/dates';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';
import type { HabitEntry } from '@/types/entry';
import OverviewStats from '@/components/dashboard/OverviewStats';
import TodayHabits from '@/components/dashboard/TodayHabits';
import WeeklyOverview from '@/components/dashboard/WeeklyOverview';
import MoodLogger from '@/components/dashboard/MoodLogger';
import DashboardShell from '@/components/dashboard/DashboardShell';
import YearHeatmap, { type HeatmapDay } from '@/components/dashboard/YearHeatmap';
import InsightCards from '@/components/dashboard/InsightCards';
import FocusBanner from '@/components/dashboard/FocusBanner';
import ActivityFeed, { type ActivityItem } from '@/components/dashboard/ActivityFeed';
import ProgressChart from '@/components/dashboard/ProgressChart';

// -----------------------------------------------------------------------
// Server-side data fetching helpers
// -----------------------------------------------------------------------

async function fetchOverviewStats(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  today: string
): Promise<OverviewStatsType | null> {
  try {
    // Week start date (computed once, used below)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = toLocalDateString(weekStart);

    // All 3 queries run in parallel instead of sequentially
    const [{ data: habits }, { data: todayEntries }, { data: weekEntries }] = await Promise.all([
      supabase
        .from('habits')
        .select('id, current_streak, longest_streak, name, total_completions')
        .eq('user_id', userId)
        .eq('is_archived', false),
      supabase
        .from('habit_entries')
        .select('habit_id, is_completed')
        .eq('user_id', userId)
        .eq('entry_date', today),
      supabase
        .from('habit_entries')
        .select('is_completed')
        .eq('user_id', userId)
        .gte('entry_date', weekStartStr)
        .lte('entry_date', today),
    ]);

    if (!habits || habits.length === 0) {
      return {
        todayCompleted: 0,
        todayTotal: 0,
        todayPercentage: 0,
        bestStreak: 0,
        bestStreakHabitName: '',
        weekPercentage: 0,
        totalCompletions: 0,
      };
    }

    const completedToday = (todayEntries ?? []).filter((e) => e.is_completed).length;
    const totalToday = habits.length;

    // Best streak
    const bestHabit = habits.reduce(
      (best: { current_streak: number; name: string } | null, h) =>
        !best || h.current_streak > best.current_streak ? h : best,
      null
    );

    const habitCount = habits.length;
    const weekCompleted = (weekEntries ?? []).filter((e) => e.is_completed).length;
    const weekDenom = habitCount * 7;
    const weekPercentage = weekDenom > 0 ? Math.min(100, Math.round((weekCompleted / weekDenom) * 100)) : 0;

    // Total completions across all habits
    const totalCompletions = habits.reduce((sum, h) => sum + (h.total_completions ?? 0), 0);

    return {
      todayCompleted: completedToday,
      todayTotal: totalToday,
      todayPercentage:
        totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0,
      bestStreak: bestHabit?.current_streak ?? 0,
      bestStreakHabitName: bestHabit?.name ?? '',
      weekPercentage,
      totalCompletions,
    };
  } catch {
    return null;
  }
}

async function fetchTodayHabits(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  today: string
): Promise<HabitWithEntry[]> {
  try {
    // Fetch habits and today's entries in parallel
    const [{ data: habits }, { data: entries }] = await Promise.all([
      supabase
        .from('habits')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true }),
      supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', today),
    ]);

    if (!habits || habits.length === 0) return [];

    const entryMap = new Map<string, HabitEntry>(
      (entries ?? []).map((e) => [e.habit_id, e as HabitEntry])
    );

    return (habits as HabitWithEntry[]).map((h) => ({
      ...h,
      todayEntry: entryMap.get(h.id) ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchWeekData(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  today: string
): Promise<{ date: string; percentage: number; isToday: boolean }[]> {
  try {
    const days: { date: string; percentage: number; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateString(d);
      days.push({
        date: dateStr,
        percentage: 0,
        isToday: dateStr === today,
      });
    }

    const weekStart = days[0].date;

    // Fetch entries and habit count in parallel
    const [{ data: entries }, { data: habits }] = await Promise.all([
      supabase
        .from('habit_entries')
        .select('entry_date, is_completed')
        .eq('user_id', userId)
        .gte('entry_date', weekStart)
        .lte('entry_date', today),
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .eq('is_archived', false),
    ]);

    const habitCount = (habits ?? []).length;
    if (habitCount === 0) return days;

    const byDate = new Map<string, { total: number; completed: number }>();
    for (const e of entries ?? []) {
      const existing = byDate.get(e.entry_date) ?? { total: 0, completed: 0 };
      existing.total += 1;
      if (e.is_completed) existing.completed += 1;
      byDate.set(e.entry_date, existing);
    }

    return days.map((day) => {
      const info = byDate.get(day.date);
      if (!info || info.total === 0) return day;
      return {
        ...day,
        percentage: Math.round((info.completed / habitCount) * 100),
      };
    });
  } catch {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = toLocalDateString(d);
      return { date: dateStr, percentage: 0, isToday: dateStr === today };
    });
  }
}

async function fetchHeatmap(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  today: string,
  days = 365
): Promise<HeatmapDay[]> {
  try {
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const startStr = toLocalDateString(start);

    const { data } = await supabase
      .from('habit_entries')
      .select('entry_date, is_completed')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('entry_date', startStr)
      .lte('entry_date', today);

    const counts = new Map<string, number>();
    for (const e of data ?? []) {
      counts.set(e.entry_date, (counts.get(e.entry_date) ?? 0) + 1);
    }

    const out: HeatmapDay[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toLocalDateString(d);
      out.push({ date: iso, count: counts.get(iso) ?? 0 });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchRecentActivity(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  limit = 10
): Promise<ActivityItem[]> {
  try {
    const { data } = await supabase
      .from('habit_entries')
      .select('id, habit_id, completed_at, habits!inner(name, icon, color)')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    return (data ?? []).map((row) => {
      const habit = (row as unknown as { habits: { name: string; icon: string; color: string } }).habits;
      return {
        entry_id:     row.id as string,
        habit_id:     row.habit_id as string,
        habit_name:   habit?.name  ?? 'Habit',
        habit_icon:   habit?.icon  ?? 'check',
        habit_color:  habit?.color ?? '#10B981',
        completed_at: row.completed_at as string,
      };
    });
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  const today = todayString();
  const userId = user?.id ?? '';

  // Parallel fetches
  const [stats, habits, weekData, heatmap, activity] = await Promise.all([
    userId ? fetchOverviewStats(supabase, userId, today) : Promise.resolve(null),
    userId ? fetchTodayHabits(supabase, userId, today) : Promise.resolve([]),
    userId ? fetchWeekData(supabase, userId, today) : Promise.resolve(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = toLocalDateString(d);
        return { date: dateStr, percentage: 0, isToday: dateStr === today };
      })
    ),
    userId ? fetchHeatmap(supabase, userId, today)       : Promise.resolve([] as HeatmapDay[]),
    userId ? fetchRecentActivity(supabase, userId)        : Promise.resolve([] as ActivityItem[]),
  ]);

  const heroPct = stats?.todayTotal
    ? Math.round(((stats.todayCompleted ?? 0) / stats.todayTotal) * 100)
    : 0;

  const heroLine =
    !stats || stats.todayTotal === 0
      ? 'Start by adding your first habit.'
      : heroPct === 100
        ? 'All done. Rest up and do it again tomorrow.'
        : heroPct >= 50
          ? `You're ${heroPct}% through today. Keep the streak alive.`
          : `${stats.todayTotal - (stats.todayCompleted ?? 0)} left today. One at a time.`;

  return (
    <DashboardShell>
      <div
        className="hf-dashboard-page"
        style={{
          padding: 'clamp(12px, 2.5vw, 32px) clamp(12px, 2.5vw, 32px) clamp(32px, 4vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 2vw, 24px)',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {/* Eyebrow + context line */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span className="eyebrow">Overview · {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <h1
            style={{
              fontSize: 'clamp(22px, 2.4vw, 28px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.03em',
              maxWidth: 640,
            }}
          >
            {heroLine}
          </h1>
        </div>

        {/* Focus banner — next habit + midnight countdown */}
        <FocusBanner habits={habits} />

        {/* Overview stats — full width */}
        <OverviewStats stats={stats} loading={false} />

        {/* Insights strip */}
        <InsightCards habits={habits} heatmap={heatmap} todayISO={today} />

        {/* Advanced progress chart — full width */}
        <ProgressChart data={heatmap} habitCount={habits.length} />

        {/* Two-column layout — stacks under lg via .hf-dashboard-grid */}
        <div className="hf-dashboard-grid">
          {/* Left — Today's Habits + Heatmap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <TodayHabits habits={habits} loading={false} />
            <YearHeatmap data={heatmap} />
          </div>

          {/* Right — Weekly Overview + Activity Feed + Mood Logger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <WeeklyOverview weekData={weekData} />
            <ActivityFeed items={activity} />
            <MoodLogger />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
