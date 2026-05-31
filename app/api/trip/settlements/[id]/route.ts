import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { safeErrorMessage } from '@/lib/utils/api';

type Params = { params: Promise<{ id: string }> };

// DELETE /api/trip/settlements/[id] — undo a recorded settle-up payment.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const { error } = await auth.supabase
      .from('trip_settlements')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to undo settlement'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to undo settlement'), 500);
  }
}
