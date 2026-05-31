import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { itinerarySchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/trip/itinerary/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = itinerarySchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const v = parsed.data;
    const { error } = await auth.supabase
      .from('trip_itinerary')
      .update({
        day: v.day,
        title: v.title,
        description: v.description || null,
        location: v.location || null,
      })
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to update day'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to update day'), 500);
  }
}

// DELETE /api/trip/itinerary/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const { error } = await auth.supabase
      .from('trip_itinerary')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to delete day'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to delete day'), 500);
  }
}
