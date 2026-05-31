import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { bookingSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/trip/bookings/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = bookingSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { error } = await auth.supabase
      .from('trip_bookings')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to update booking'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to update booking'), 500);
  }
}

// DELETE /api/trip/bookings/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const { error } = await auth.supabase
      .from('trip_bookings')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to delete booking'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to delete booking'), 500);
  }
}
