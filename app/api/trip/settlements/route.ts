import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { settlementSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

// POST /api/trip/settlements — record a "settle up" payment between two travelers.
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = settlementSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const v = parsed.data;
    const { error } = await auth.supabase.from('trip_settlements').insert({
      user_id: auth.user.id,
      trip_id: v.trip_id,
      from_person: v.from_person,
      to_person: v.to_person,
      amount: v.amount,
    });
    if (error) return err(safeErrorMessage(error, 'Failed to record settlement'), 500);
    return ok(true, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to record settlement'), 500);
  }
}
