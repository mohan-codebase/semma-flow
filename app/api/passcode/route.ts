import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';
import { hashPasscode } from '@/lib/passcode';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/passcode — lock status only. Never returns the code (hashed or not):
// verification happens server-side via POST /api/passcode/verify.
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('habits_passcode')
      .eq('id', user.id)
      .maybeSingle();
    if (error) return err(safeErrorMessage(error, 'Failed to load lock status'), 500);

    // Biometric is optional and lives in a separate table (migration 021). If
    // that table isn't applied yet it must NOT break the passcode lock — the
    // passcode status always comes from the server regardless.
    let hasBiometric = false;
    const { count, error: credErr } = await supabase
      .from('habit_lock_credentials')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (!credErr) hasBiometric = (count ?? 0) > 0;

    return ok({
      hasPasscode: Boolean(profile?.habits_passcode),
      hasBiometric,
    });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to load lock status'), 500);
  }
}

// PUT /api/passcode — set/update the habit passcode (stored as a salted hash).
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json().catch(() => null);
    const passcode = typeof body?.passcode === 'string' ? body.passcode.trim() : '';
    if (!passcode) return err('Passcode cannot be empty', 422);

    const { error } = await supabase
      .from('profiles')
      .update({ habits_passcode: hashPasscode(passcode) })
      .eq('id', user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to save passcode'), 500);
    return ok({ hasPasscode: true });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to save passcode'), 500);
  }
}

// DELETE /api/passcode — remove the lock entirely. Without a passcode there is
// no recovery path, so any biometric credentials are torn down too.
export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { error } = await supabase
      .from('profiles')
      .update({ habits_passcode: null })
      .eq('id', user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to remove passcode'), 500);

    const { error: credErr } = await supabase
      .from('habit_lock_credentials')
      .delete()
      .eq('user_id', user.id);
    if (credErr) return err(safeErrorMessage(credErr, 'Failed to remove biometrics'), 500);

    return ok({ hasPasscode: false, hasBiometric: false });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to remove passcode'), 500);
  }
}
