import { createServerClient } from '@/lib/supabase/server';
import { todayString, toLocalDateString } from '@/lib/utils/dates';
import type { HabitWithEntry } from '@/types/habit';
import type { HabitEntry } from '@/types/entry';
import ActivityDetail from '@/components/dashboard/ActivityDetail';

async function fetchWeekRings(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  today: string
) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = toLocalDateString(d);
    return { date, percentage: 0, isToday: date === today };
  });

  const weekStart = days[0].date;

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

  const byDate = new Map<string, { completed: number }>();
  for (const e of entries ?? []) {
    const cur = byDate.get(e.entry_date) ?? { completed: 0 };
    if (e.is_completed) cur.completed += 1;
    byDate.set(e.entry_date, cur);
  }

  return days.map((day) => {
    const info = byDate.get(day.date);
    return {
      ...day,
      percentage: info ? Math.round((info.completed / habitCount) * 100) : 0,
    };
  });
}

async function fetchTodayHabits(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  today: string
): Promise<HabitWithEntry[]> {
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
}

export default async function ActivityPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id ?? '';
  const today = todayString();

  const [weekData, habits] = await Promise.all([
    userId ? fetchWeekRings(supabase, userId, today) : Promise.resolve([]),
    userId ? fetchTodayHabits(supabase, userId, today) : Promise.resolve([]),
  ]);

  const totalCompletions = habits.reduce(
    (sum, h) => sum + (h.total_completions ?? 0),
    0
  );

  const bestStreak = habits.reduce(
    (best, h) => Math.max(best, h.current_streak ?? 0),
    0
  );

  const weekPct =
    weekData.length > 0
      ? Math.round(weekData.reduce((s, d) => s + d.percentage, 0) / weekData.length)
      : 0;

  return (
    <ActivityDetail
      habits={habits}
      weekData={weekData}
      totalCompletions={totalCompletions}
      bestStreak={bestStreak}
      weekPct={weekPct}
      today={today}
    />
  );
}
