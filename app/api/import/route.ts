import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';

/**
 * POST /api/import
 * Imports habits and entries from a JSON backup.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { habits, entries, moods } = body;

    if (!Array.isArray(habits)) {
      return NextResponse.json({ error: 'Invalid habits data' }, { status: 422 });
    }

    // 1. Create/Update habits and build a mapping of old_id -> new_id
    // This is important because the IDs in the JSON might conflict or be different
    const idMap: Record<string, string> = {};
    
    for (const h of habits) {
      const { id: oldId, user_id, created_at, updated_at, ...cleanHabit } = h;
      
      // We attempt to find an existing habit with the same name to avoid duplicates
      // Or we can just insert new ones. For a "Restore", we usually want to recreate.
      const { data: existing } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', cleanHabit.name)
        .maybeSingle();

      if (existing) {
        idMap[oldId] = existing.id;
        // Optionally update existing habit stats
        await supabase.from('habits').update(cleanHabit).eq('id', existing.id);
      } else {
        const { data: inserted, error } = await supabase
          .from('habits')
          .insert({ ...cleanHabit, user_id: user.id })
          .select()
          .single();
        
        if (inserted) idMap[oldId] = inserted.id;
      }
    }

    // 2. Import Entries
    if (Array.isArray(entries)) {
      const entriesToInsert = entries
        .filter(e => idMap[e.habit_id]) // Only import entries for habits we successfully mapped
        .map(e => ({
          habit_id: idMap[e.habit_id],
          user_id: user.id,
          entry_date: e.entry_date,
          is_completed: e.is_completed,
          value: e.value,
          notes: e.notes,
          completed_at: e.completed_at,
        }));

      if (entriesToInsert.length > 0) {
        // Chunk inserts to avoid large payload errors
        const chunkSize = 100;
        for (let i = 0; i < entriesToInsert.length; i += chunkSize) {
          const chunk = entriesToInsert.slice(i, i + chunkSize);
          await supabase.from('habit_entries').upsert(chunk, { onConflict: 'habit_id,entry_date' });
        }
      }
    }

    // 3. Import Moods
    if (Array.isArray(moods)) {
      const moodsToInsert = moods.map(m => ({
        user_id: user.id,
        entry_date: m.entry_date,
        mood_score: m.mood_score,
        energy_level: m.energy_level,
        note: m.note
      }));
      if (moodsToInsert.length > 0) {
        await supabase.from('daily_moods').upsert(moodsToInsert, { onConflict: 'user_id,entry_date' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      habitsCount: habits.length,
      entriesCount: entries?.length || 0 
    });
  } catch (e) {
    return NextResponse.json({ error: safeErrorMessage(e) }, { status: 500 });
  }
}
