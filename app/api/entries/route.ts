import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { entrySchema } from '@/lib/validations/entry';
import { toLocalDateString } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/entries?date=YYYY-MM-DD  OR  ?habit_id=&from=&to=
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const sp = req.nextUrl.searchParams;
    const date = sp.get('date');
    const habitId = sp.get('habit_id');
    const from = sp.get('from');
    const to = sp.get('to');

    let query = supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', user.id);

    if (date) {
      query = query.eq('entry_date', date);
    } else if (habitId) {
      query = query.eq('habit_id', habitId);
      if (from) query = query.gte('entry_date', from);
      if (to) query = query.lte('entry_date', to);
    } else {
      return err('Provide date or habit_id', 400);
    }

    query = query.order('entry_date', { ascending: false });
    const { data, error } = await query;
    if (error) return err(safeErrorMessage(error, 'Failed to load entries'), 500);
    return ok(data ?? []);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to load entries'), 500);
  }
}

// PATCH /api/entries — upsert a single entry
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = entrySchema.safeParse(body);
    if (!parsed.success) {
      return err('Invalid entry payload', 422);
    }

    const { habit_id, entry_date, is_completed, value, notes } = parsed.data;

    // Verify the habit belongs to this user
    const { data: habit } = await supabase
      .from('habits')
      .select('id, total_completions, current_streak, longest_streak')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single();

    if (!habit) return err('Habit not found', 404);

    const now = new Date().toISOString();
    const { data: entry, error } = await supabase
      .from('habit_entries')
      .upsert(
        {
          habit_id,
          user_id: user.id,
          entry_date,
          is_completed,
          value: value ?? null,
          notes: notes ?? null,
          completed_at: is_completed ? now : null,
          updated_at: now,
        },
        { onConflict: 'habit_id,entry_date' }
      )
      .select()
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to save entry'), 500);

    // Recalculate streak and total_completions
    const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle();
    await recalculateHabitStats(supabase, habit_id, user.id, profile?.timezone);

    return ok(entry);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to save entry'), 500);
  }
}

// POST /api/entries — same as PATCH (alias)
export const POST = PATCH;

async function recalculateHabitStats(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  habitId: string,
  userId: string,
  timezone?: string
) {
  try {
    // Count total completions
    const { count: totalCompletions } = await supabase
      .from('habit_entries')
      .select('*', { count: 'exact', head: true })
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('is_completed', true);

    // Calculate current streak (consecutive days back from today)
    const { data: entries } = await supabase
      .from('habit_entries')
      .select('entry_date, is_completed')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('entry_date', { ascending: false })
      .limit(400);

    const completedDates = new Set((entries ?? []).map((e) => e.entry_date));

    const userTz = timezone || 'Asia/Kolkata';
    let streak = 0;
    const today = new Date();
    // Check today first; if not completed, check yesterday (allow today to be in progress)
    let checkDate = new Date(today);
    const todayStr = formatInTimeZone(today, userTz, 'yyyy-MM-dd');
    if (!completedDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const dateStr = formatInTimeZone(checkDate, userTz, 'yyyy-MM-dd');
      if (completedDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get current longest streak
    const { data: habitRow } = await supabase
      .from('habits')
      .select('longest_streak')
      .eq('id', habitId)
      .single();

    const longestStreak = Math.max(habitRow?.longest_streak ?? 0, streak);

    await supabase
      .from('habits')
      .update({
        total_completions: totalCompletions ?? 0,
        current_streak: streak,
        longest_streak: longestStreak,
        updated_at: new Date().toISOString(),
      })
      .eq('id', habitId)
      .eq('user_id', userId);
  } catch {
    // Non-fatal
  }
}
