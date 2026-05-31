import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { safeErrorMessage } from '@/lib/utils/api';

type Params = { params: Promise<{ id: string }> };

// DELETE /api/trip/documents/[id] — removes the Storage object then the row.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const { data: doc } = await auth.supabase
      .from('trip_documents')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (doc?.file_path) {
      await auth.supabase.storage.from('trip-documents').remove([doc.file_path]);
    }

    const { error } = await auth.supabase
      .from('trip_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to delete document'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to delete document'), 500);
  }
}
