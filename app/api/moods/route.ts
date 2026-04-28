import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { moodSchema } from '@/lib/validations/entry';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/moods?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const date = req.nextUrl.searchParams.get('date');
    if (!date) return err('date param required', 400);

    const { data, error } = await supabase
      .from('daily_moods')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', date)
      .maybeSingle();

    if (error) return err(error.message, 500);
    return ok(data ?? null);
  } catch (e) {
    return err(String(e), 500);
  }
}

// POST /api/moods — upsert today's mood
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = moodSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.message, 422);
    }



    const { data, error } = await supabase
      .from('daily_moods')
      .upsert(
        { ...parsed.data, user_id: user.id },
        { onConflict: 'user_id,entry_date' }
      )
      .select()
      .single();

    if (error) return err(error.message, 500);
    return ok(data, 201);
  } catch (e) {
    return err(String(e), 500);
  }
}
