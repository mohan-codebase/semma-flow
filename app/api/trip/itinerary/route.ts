import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { itinerarySchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

// POST /api/trip/itinerary
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = itinerarySchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const v = parsed.data;
    const { error } = await auth.supabase.from('trip_itinerary').insert({
      user_id: auth.user.id,
      trip_id: v.trip_id,
      day: v.day,
      title: v.title,
      description: v.description || null,
      location: v.location || null,
    });
    if (error) return err(safeErrorMessage(error, 'Failed to add day'), 500);
    return ok(true, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to add day'), 500);
  }
}
