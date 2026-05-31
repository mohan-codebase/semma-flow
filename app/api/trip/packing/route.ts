import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { packingSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

// POST /api/trip/packing
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = packingSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { error } = await auth.supabase
      .from('trip_packing_items')
      .insert({ user_id: auth.user.id, trip_id: parsed.data.trip_id, item: parsed.data.item });
    if (error) return err(safeErrorMessage(error, 'Failed to add item'), 500);
    return ok(true, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to add item'), 500);
  }
}
