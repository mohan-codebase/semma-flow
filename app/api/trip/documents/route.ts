import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { documentMetaSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

// POST /api/trip/documents — save metadata after a client Storage upload.
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = documentMetaSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const v = parsed.data;
    // Defence in depth: the file must live under this user's storage folder.
    if (!v.file_path.startsWith(`${auth.user.id}/`)) {
      return err('Invalid file path', 400);
    }

    const { error } = await auth.supabase.from('trip_documents').insert({
      user_id: auth.user.id,
      trip_id: v.trip_id,
      name: v.name,
      category: v.category,
      file_path: v.file_path,
      size_bytes: v.size_bytes,
      mime_type: v.mime_type ?? null,
    });
    if (error) return err(safeErrorMessage(error, 'Failed to save document'), 500);
    return ok(true, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to save document'), 500);
  }
}
