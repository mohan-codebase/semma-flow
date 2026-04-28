import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { toLocalDateString } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';

function ok<T>(data: T) {
  return NextResponse.json({ data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();
    const userTz = profile?.timezone || 'Asia/Kolkata';

    const today = formatInTimeZone(new Date(), userTz, 'yyyy-MM-dd');

    const { data: habits } = await supabase
      .from('habits')
      .select('id, current_streak, longest_streak, name, total_completions')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    if (!habits || habits.length === 0) {
      return ok({
        todayCompleted: 0, todayTotal: 0, todayPercentage: 0,
        bestStreak: 0, bestStreakHabitName: '',
        weekPercentage: 0, totalCompletions: 0,
      });
    }

    const { data: todayEntries } = await supabase
      .from('habit_entries')
      .select('habit_id, is_completed')
      .eq('user_id', user.id)
      .eq('entry_date', today);

    const completedToday = (todayEntries ?? []).filter((e) => e.is_completed).length;

    const bestHabit = habits.reduce(
      (best: { current_streak: number; name: string } | null, h) =>
        !best || h.current_streak > best.current_streak ? h : best,
      null
    );

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = formatInTimeZone(weekStart, userTz, 'yyyy-MM-dd');

    const { data: weekEntries } = await supabase
      .from('habit_entries')
      .select('is_completed')
      .eq('user_id', user.id)
      .gte('entry_date', weekStartStr)
      .lte('entry_date', today);

    const weekCompleted = (weekEntries ?? []).filter((e) => e.is_completed).length;
    const weekPercentage = Math.round((weekCompleted / (habits.length * 7)) * 100);

    const totalCompletions = habits.reduce((sum, h) => sum + (h.total_completions ?? 0), 0);

    return ok({
      todayCompleted: completedToday,
      todayTotal: habits.length,
      todayPercentage: Math.round((completedToday / habits.length) * 100),
      bestStreak: bestHabit?.current_streak ?? 0,
      bestStreakHabitName: bestHabit?.name ?? '',
      weekPercentage,
      totalCompletions,
    });
  } catch (e) {
    return err(String(e), 500);
  }
}
