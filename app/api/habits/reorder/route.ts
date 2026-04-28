import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';

/**
 * PATCH /api/habits/reorder
 * Bulk updates the sort_order of habits for the authenticated user.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { habitIds } = body; // Array of IDs in order

    if (!Array.isArray(habitIds)) {
      return NextResponse.json({ data: null, error: 'Invalid payload' }, { status: 422 });
    }

    // We use a manual multi-update or a loop. 
    // In a high-perf scenario, a RPC function is better, but for ~20 habits, 
    // parallel updates are fine.
    const updates = habitIds.map((id, index) => 
      supabase
        .from('habits')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('user_id', user.id)
    );

    const results = await Promise.all(updates);
    const error = results.find(r => r.error);
    
    if (error) {
      return NextResponse.json({ data: null, error: 'Failed to reorder some habits' }, { status: 500 });
    }

    return NextResponse.json({ data: 'ok', error: null });
  } catch (e) {
    return NextResponse.json({ data: null, error: safeErrorMessage(e) }, { status: 500 });
  }
}
