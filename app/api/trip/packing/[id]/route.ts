import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { packingPatchSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/trip/packing/[id] — toggle completed.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = packingPatchSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { error } = await auth.supabase
      .from('trip_packing_items')
      .update({ completed: parsed.data.completed })
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to update item'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to update item'), 500);
  }
}

// DELETE /api/trip/packing/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const { error } = await auth.supabase
      .from('trip_packing_items')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to delete item'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to delete item'), 500);
  }
}
