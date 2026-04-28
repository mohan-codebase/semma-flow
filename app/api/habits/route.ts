import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { habitSchema } from '@/lib/validations/habit';
import { toLocalDateString } from '@/lib/utils/dates';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/habits?archived=true|false
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const archived = req.nextUrl.searchParams.get('archived') === 'true';
    const today = toLocalDateString();

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .eq('is_archived', archived)
      .order('sort_order', { ascending: true });

    if (error) return err(safeErrorMessage(error, 'Failed to load habits'), 500);

    if (!habits || habits.length === 0) return ok([]);

    // Fetch today's entries in one query
    const habitIds = habits.map((h) => h.id);
    const { data: entries } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .in('habit_id', habitIds);

    const entryMap = new Map((entries ?? []).map((e) => [e.habit_id, e]));

    // Compute 30-day completion rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = toLocalDateString(thirtyDaysAgo);

    const { data: recentEntries } = await supabase
      .from('habit_entries')
      .select('habit_id, is_completed')
      .eq('user_id', user.id)
      .in('habit_id', habitIds)
      .gte('entry_date', thirtyDaysAgoStr)
      .lte('entry_date', today);

    const rateMap = new Map<string, { total: number; completed: number }>();
    for (const e of recentEntries ?? []) {
      const r = rateMap.get(e.habit_id) ?? { total: 0, completed: 0 };
      r.total += 1;
      if (e.is_completed) r.completed += 1;
      rateMap.set(e.habit_id, r);
    }

    const result = habits.map((h) => {
      const r = rateMap.get(h.id);
      const completionRate = r && r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
      return {
        ...h,
        todayEntry: entryMap.get(h.id) ?? null,
        completionRate,
      };
    });

    return ok(result);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to load habits'), 500);
  }
}

// POST /api/habits
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = habitSchema.safeParse(body);
    if (!parsed.success) {
      return err('Invalid habit payload', 422);
    }



    // Get next sort_order
    const { data: maxRow } = await supabase
      .from('habits')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (maxRow?.sort_order ?? -1) + 1;

    const { data: habit, error } = await supabase
      .from('habits')
      .insert({
        ...parsed.data,
        user_id: user.id,
        sort_order: sortOrder,
      })
      .select('*, category:categories(*)')
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to create habit'), 500);
    return ok(habit, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to create habit'), 500);
  }
}
