import { createServerClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';
import type { HabitEntry } from '@/types/entry';
import DashboardApp from '@/components/dashboard/DashboardApp';
import { ensureTrip, getExpenses, getSettlements } from '@/lib/trip/server';
import type { Trip, TripExpense, TripSettlement } from '@/lib/trip/types';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  const userId = user?.id ?? '';

  let userTz = 'Asia/Kolkata';
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .maybeSingle();
    userTz = profile?.timezone ?? 'Asia/Kolkata';
  }

  const today = userId ? formatInTimeZone(new Date(), userTz, 'yyyy-MM-dd') : todayString();

  // Build 7-day window (oldest → today)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = formatInTimeZone(d, userTz, 'yyyy-MM-dd');
    return { date, isToday: date === today };
  });
  const weekStart = weekDays[0].date;

  // Queries in parallel — habits, today's entries, week entries, and active trip
  type WeekEntry = { entry_date: string; habit_id: string; is_completed: boolean };
  let habitsRaw: HabitWithEntry[] = [];
  let todayEntriesRaw: HabitEntry[] = [];
  let weekEntriesRaw: WeekEntry[] = [];
  let activeTripName = '';

  let activeTrip: Trip | null = null;
  let tripExpenses: TripExpense[] = [];
  let tripSettlements: TripSettlement[] = [];

  if (userId) {
    const [habitsRes, todayRes, weekRes, tripCtx] = await Promise.all([
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
      supabase
        .from('habit_entries')
        .select('entry_date, habit_id, is_completed')
        .eq('user_id', userId)
        .gte('entry_date', weekStart)
        .lte('entry_date', today),
      ensureTrip(),
    ]);
    habitsRaw = (habitsRes.data ?? []) as HabitWithEntry[];
    todayEntriesRaw = (todayRes.data ?? []) as HabitEntry[];
    weekEntriesRaw = (weekRes.data ?? []) as WeekEntry[];
    activeTripName = tripCtx?.trip?.name ?? '';
    activeTrip = tripCtx?.trip ?? null;

    // Fetch trip expenses + settlements in parallel (non-blocking for habits)
    if (activeTrip) {
      [tripExpenses, tripSettlements] = await Promise.all([
        getExpenses(activeTrip.id),
        getSettlements(activeTrip.id),
      ]);
    }
  }

  // Build today's habit list with entry state attached
  const todayEntryMap = new Map<string, HabitEntry>(
    todayEntriesRaw.map((e) => [e.habit_id, e])
  );
  const habits: HabitWithEntry[] = habitsRaw.map((h) => ({
    ...h,
    todayEntry: todayEntryMap.get(h.id) ?? null,
  }));

  // Good habits (non-bad) drive all stats and the week bar chart
  const goodHabits = habitsRaw.filter((h) => !h.is_bad_habit);
  const goodHabitIds = new Set<string>(goodHabits.map((h) => h.id));
  const goodHabitCount = goodHabits.length;

  // Overview stats
  let stats: OverviewStatsType | null = null;
  if (userId) {
    if (goodHabitCount === 0) {
      stats = {
        todayCompleted: 0, todayTotal: 0, todayPercentage: 0,
        bestStreak: 0, bestStreakHabitName: '',
        weekPercentage: 0, totalCompletions: 0,
      };
    } else {
      const completedToday = todayEntriesRaw.filter(
        (e) => goodHabitIds.has(e.habit_id) && e.is_completed
      ).length;

      const bestHabit = goodHabits.reduce(
        (best: { current_streak: number; name: string } | null, h) =>
          !best || (h as any).current_streak > best.current_streak ? h : best,
        null
      ) as { current_streak: number; name: string } | null;

      const weekCompleted = weekEntriesRaw.filter(
        (e) => goodHabitIds.has(e.habit_id) && e.is_completed
      ).length;

      stats = {
        todayCompleted: completedToday,
        todayTotal: goodHabitCount,
        todayPercentage: Math.round((completedToday / goodHabitCount) * 100),
        bestStreak: (bestHabit as any)?.current_streak ?? 0,
        bestStreakHabitName: bestHabit?.name ?? '',
        weekPercentage: Math.min(
          100,
          Math.round((weekCompleted / (goodHabitCount * 7)) * 100)
        ),
        totalCompletions: goodHabits.reduce(
          (sum, h) => sum + ((h as any).total_completions ?? 0),
          0
        ),
      };
    }
  }

  // Week bar-chart data — completed count per day / total good habits
  const completedByDate = new Map<string, number>();
  for (const e of weekEntriesRaw) {
    if (goodHabitIds.has(e.habit_id) && e.is_completed) {
      completedByDate.set(e.entry_date, (completedByDate.get(e.entry_date) ?? 0) + 1);
    }
  }
  const weekData = weekDays.map(({ date, isToday }) => ({
    date,
    isToday,
    percentage:
      goodHabitCount > 0
        ? Math.round(((completedByDate.get(date) ?? 0) / goodHabitCount) * 100)
        : 0,
  }));

  // Display helpers
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
      activeTripName={activeTripName}
      activeTrip={activeTrip}
      tripExpenses={tripExpenses}
      tripSettlements={tripSettlements}
    />
  );
}
