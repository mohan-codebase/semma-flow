import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';
import { verifyPasscode } from '@/lib/passcode';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// POST /api/passcode/verify — check a passcode against the stored hash,
// server-side. The raw code never leaves the request body.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json().catch(() => null);
    const passcode = typeof body?.passcode === 'string' ? body.passcode : '';
    if (!passcode) return err('Passcode required', 422);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('habits_passcode')
      .eq('id', user.id)
      .maybeSingle();
    if (error) return err(safeErrorMessage(error, 'Failed to verify passcode'), 500);

    const verified = verifyPasscode(passcode, profile?.habits_passcode);
    return ok({ verified });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to verify passcode'), 500);
  }
}
