import { NextRequest, NextResponse } from 'next/server';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';
import { getRelyingParty, setChallenge, takeChallenge, AUTH_CHALLENGE_COOKIE } from '@/lib/webauthn';

type AuthenticationResponse = Parameters<typeof verifyAuthenticationResponse>[0]['response'];

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/passcode/webauthn/authenticate — authentication options (challenge).
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { rpID } = getRelyingParty(req);

    const { data: creds, error } = await supabase
      .from('habit_lock_credentials')
      .select('credential_id, transports')
      .eq('user_id', user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to start authentication'), 500);
    if (!creds || creds.length === 0) return err('No biometric registered', 404);

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: creds.map((c) => ({
        id: c.credential_id as string,
        transports: (c.transports ?? undefined) as AuthenticatorTransport[] | undefined,
      })),
    });

    await setChallenge(AUTH_CHALLENGE_COOKIE, options.challenge);
    return ok(options);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to start authentication'), 500);
  }
}

// POST /api/passcode/webauthn/authenticate — verify assertion, unlock habits.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json().catch(() => null);
    const response = body?.response as AuthenticationResponse | undefined;
    if (!response?.id) return err('Missing authentication response', 422);

    const expectedChallenge = await takeChallenge(AUTH_CHALLENGE_COOKIE);
    if (!expectedChallenge) return err('Authentication challenge expired. Try again.', 400);

    const { data: cred, error } = await supabase
      .from('habit_lock_credentials')
      .select('id, credential_id, public_key, counter, transports')
      .eq('user_id', user.id)
      .eq('credential_id', response.id)
      .maybeSingle();
    if (error) return err(safeErrorMessage(error, 'Failed to verify biometric'), 500);
    if (!cred) return err('Unknown credential', 404);

    const { rpID, origin } = getRelyingParty(req);
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: cred.credential_id as string,
        publicKey: new Uint8Array(Buffer.from(cred.public_key as string, 'base64url')),
        counter: Number(cred.counter ?? 0),
        transports: (cred.transports ?? undefined) as AuthenticatorTransport[] | undefined,
      },
    });

    if (!verification.verified) return err('Biometric verification failed', 401);

    await supabase
      .from('habit_lock_credentials')
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', cred.id);

    return ok({ verified: true });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to verify biometric'), 500);
  }
}
