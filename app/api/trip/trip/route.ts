import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { tripSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

// POST /api/trip/trip — create a new trip
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = tripSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { data, error } = await auth.supabase
      .from('trip_trips')
      .insert({
        user_id: auth.user.id,
        name: parsed.data.name,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        total_budget: parsed.data.total_budget,
        travelers: parsed.data.travelers || ['Mohan', 'Charles'],
      })
      .select('*')
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to create trip'), 500);
    return ok(data, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to create trip'), 500);
  }
}

// PATCH /api/trip/trip — update a specific trip
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const body = await req.json();
    const { id, ...tripData } = body;
    if (!id) return err('Trip ID is required');

    const parsed = tripSchema.safeParse(tripData);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { error } = await auth.supabase
      .from('trip_trips')
      .update({
        name: parsed.data.name,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        total_budget: parsed.data.total_budget,
        travelers: parsed.data.travelers,
      })
      .eq('id', id)
      .eq('user_id', auth.user.id);

    if (error) return err(safeErrorMessage(error, 'Failed to update trip'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to update trip'), 500);
  }
}

// DELETE /api/trip/trip — delete a specific trip
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return err('Trip ID is required');

    const { error } = await auth.supabase
      .from('trip_trips')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);

    if (error) return err(safeErrorMessage(error, 'Failed to delete trip'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to delete trip'), 500);
  }
}
