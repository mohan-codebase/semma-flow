import { createServerClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';
import type { HabitEntry } from '@/types/entry';
import DashboardApp from '@/components/dashboard/DashboardApp';

// -----------------------------------------------------------------------
// Server-side data fetching helpers
// -----------------------------------------------------------------------

async function fetchOverviewStats(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  today: string,
  userTz: string
): Promise<OverviewStatsType | null> {
  try {
    // Week start date (computed once, used below)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = formatInTimeZone(weekStart, userTz, 'yyyy-MM-dd');

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
  today: string,
  userTz: string
): Promise<{ date: string; percentage: number; isToday: boolean }[]> {
  try {
    const days: { date: string; percentage: number; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatInTimeZone(d, userTz, 'yyyy-MM-dd');
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
      const dateStr = formatInTimeZone(d, userTz, 'yyyy-MM-dd');
      return { date: dateStr, percentage: 0, isToday: dateStr === today };
    });
  }
}

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  const userId = user?.id ?? '';

  // Fetch timezone so date boundaries match the user's local calendar
  let userTz = 'Asia/Kolkata';
  if (userId) {
    const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', userId).maybeSingle();
    userTz = profile?.timezone ?? 'Asia/Kolkata';
  }

  const today = userId ? formatInTimeZone(new Date(), userTz, 'yyyy-MM-dd') : todayString();

  // Parallel fetches
  const [stats, habits, weekData] = await Promise.all([
    userId ? fetchOverviewStats(supabase, userId, today, userTz) : Promise.resolve(null),
    userId ? fetchTodayHabits(supabase, userId, today) : Promise.resolve([]),
    userId ? fetchWeekData(supabase, userId, today, userTz) : Promise.resolve(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = formatInTimeZone(d, userTz, 'yyyy-MM-dd');
        return { date: dateStr, percentage: 0, isToday: dateStr === today };
      })
    ),
  ]);

  const displayName: string =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayName = new Date().toLocaleDateString(undefined, { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <DashboardApp
      stats={stats}
      habits={habits}
      weekData={weekData}
      displayName={displayName}
      initials={initials}
      email={user?.email ?? ''}
      greeting={greeting}
      heroLine={heroLine}
      heroPct={heroPct}
      dayName={dayName}
      dateStr={dateStr}
    />
  );
}
