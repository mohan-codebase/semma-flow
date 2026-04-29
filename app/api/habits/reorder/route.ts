import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';

const reorderSchema = z.object({
  habitIds: z.array(z.string().uuid()).min(1).max(200),
});

/**
 * PATCH /api/habits/reorder
 *
 * Atomically updates sort_order of habits for the authenticated user via the
 * `reorder_habits` SQL RPC. Replaces the previous fan-out of N parallel updates
 * which had no transactional guarantee and could leave the list in a partially
 * reordered state on partial failure.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = reorderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: 'Invalid payload' }, { status: 422 });
    }

    const { error } = await supabase.rpc('reorder_habits', {
      p_habit_ids: parsed.data.habitIds,
    });

    if (error) {
      return NextResponse.json(
        { data: null, error: safeErrorMessage(error, 'Failed to reorder habits') },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: 'ok', error: null });
  } catch (e) {
    return NextResponse.json({ data: null, error: safeErrorMessage(e) }, { status: 500 });
  }
}
