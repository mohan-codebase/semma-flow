import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { habitSchema } from '@/lib/validations/habit';
import { entrySchema, moodSchema } from '@/lib/validations/entry';
import { safeErrorMessage } from '@/lib/utils/api';

// Size cap: 5 MB. Real backups are tiny — anything larger is suspicious.
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const importSchema = z.object({
  habits: z.array(habitSchema.extend({ id: z.string().optional() })).max(500),
  entries: z.array(entrySchema.extend({ habit_id: z.string() }).partial({ habit_id: true })).max(50_000).optional(),
  moods: z.array(moodSchema).max(5000).optional(),
});

/**
 * POST /api/import
 * Imports a previous JSON backup. Validates every habit/entry/mood with the
 * same Zod schemas the regular API uses, so we can't be coerced into writing
 * fields the user couldn't write through normal POSTs (e.g. forging streaks
 * or current_streak inflation).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Reject oversized payloads up front. content-length isn't 100% reliable
    // for chunked uploads but catches the obvious abuse cases.
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Backup file too large (max 5 MB)' }, { status: 413 });
    }

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = importSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 422 });
    }

    const { habits, entries, moods } = parsed.data;
    const idMap: Record<string, string> = {};

    // 1. Habits — match by name to avoid duplicates on repeated imports.
    for (const h of habits) {
      const { id: oldId, ...cleanHabit } = h;

      const { data: existing } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', cleanHabit.name)
        .maybeSingle();

      if (existing) {
        if (oldId) idMap[oldId] = existing.id;
        await supabase.from('habits').update(cleanHabit).eq('id', existing.id).eq('user_id', user.id);
      } else {
        const { data: inserted } = await supabase
          .from('habits')
          .insert({ ...cleanHabit, user_id: user.id })
          .select('id')
          .single();
        if (inserted && oldId) idMap[oldId] = inserted.id;
      }
    }

    // 2. Entries — chunked upserts. Drop entries that don't map to a known habit.
    let entriesCount = 0;
    if (entries && entries.length > 0) {
      const entriesToInsert = entries
        .filter((e) => e.habit_id && idMap[e.habit_id])
        .map((e) => ({
          habit_id: idMap[e.habit_id!],
          user_id: user.id,
          entry_date: e.entry_date,
          is_completed: e.is_completed,
          value: e.value ?? null,
          notes: e.notes ?? null,
        }));

      const chunkSize = 200;
      for (let i = 0; i < entriesToInsert.length; i += chunkSize) {
        const chunk = entriesToInsert.slice(i, i + chunkSize);
        await supabase.from('habit_entries').upsert(chunk, { onConflict: 'habit_id,entry_date' });
      }
      entriesCount = entriesToInsert.length;
    }

    // 3. Moods
    let moodsCount = 0;
    if (moods && moods.length > 0) {
      const moodsToInsert = moods.map((m) => ({
        user_id: user.id,
        entry_date: m.entry_date,
        mood_score: m.mood_score,
        energy_level: m.energy_level ?? null,
        note: m.note ?? null,
      }));
      await supabase.from('daily_moods').upsert(moodsToInsert, { onConflict: 'user_id,entry_date' });
      moodsCount = moodsToInsert.length;
    }

    return NextResponse.json({
      success: true,
      habitsCount: habits.length,
      entriesCount,
      moodsCount,
    });
  } catch (e) {
    return NextResponse.json({ error: safeErrorMessage(e) }, { status: 500 });
  }
}
