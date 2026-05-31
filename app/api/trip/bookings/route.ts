import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { bookingSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

// POST /api/trip/bookings
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = bookingSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { error } = await auth.supabase
      .from('trip_bookings')
      .insert({ user_id: auth.user.id, ...parsed.data });
    if (error) return err(safeErrorMessage(error, 'Failed to add booking'), 500);
    return ok(true, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to add booking'), 500);
  }
}
