import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'No user' });

  // Get a habit
  const { data: habit } = await supabase.from('habits').select('*').limit(1).single();
  
  if (!habit) return NextResponse.json({ error: 'No habit' });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('habit_entries')
    .upsert(
      {
        habit_id: habit.id,
        user_id: user.id,
        entry_date: '2026-05-14',
        is_completed: true,
      },
      { onConflict: 'habit_id,entry_date' }
    )
    .select()
    .single();

  return NextResponse.json({ data, error });
}
