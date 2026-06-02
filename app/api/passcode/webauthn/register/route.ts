import { NextRequest, NextResponse } from 'next/server';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';
import { getRelyingParty, setChallenge, takeChallenge, REG_CHALLENGE_COOKIE } from '@/lib/webauthn';

// Derive the request body shape straight from the lib so we don't depend on a
// named type export that shifts between major versions.
type RegistrationResponse = Parameters<typeof verifyRegistrationResponse>[0]['response'];

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

function deviceLabelFromUA(ua: string | null): string | null {
  if (!ua) return null;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'This device';
}

// GET /api/passcode/webauthn/register — registration options (challenge).
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { rpID, rpName } = getRelyingParty(req);

    const { data: existing, error } = await supabase
      .from('habit_lock_credentials')
      .select('credential_id, transports')
      .eq('user_id', user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to start registration'), 500);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email ?? user.id,
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id as string,
        transports: (c.transports ?? undefined) as AuthenticatorTransport[] | undefined,
      })),
      authenticatorSelection: {
        // Built-in biometric (Face ID / Touch ID / Windows Hello), not roaming keys.
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
    });

    await setChallenge(REG_CHALLENGE_COOKIE, options.challenge);
    return ok(options);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to start registration'), 500);
  }
}

// POST /api/passcode/webauthn/register — verify attestation, store credential.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json().catch(() => null);
    const response = body?.response as RegistrationResponse | undefined;
    if (!response) return err('Missing registration response', 422);

    const expectedChallenge = await takeChallenge(REG_CHALLENGE_COOKIE);
    if (!expectedChallenge) return err('Registration challenge expired. Try again.', 400);

    const { rpID, origin } = getRelyingParty(req);
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return err('Could not verify the biometric registration', 400);
    }

    const { credential } = verification.registrationInfo;
    const { error } = await supabase.from('habit_lock_credentials').insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: (credential.transports ?? response.response.transports ?? null) as string[] | null,
      device_label: deviceLabelFromUA(req.headers.get('user-agent')),
    });
    if (error) return err(safeErrorMessage(error, 'Failed to save biometric'), 500);

    return ok({ verified: true });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to register biometric'), 500);
  }
}

// DELETE /api/passcode/webauthn/register — remove all biometric credentials
// for the user. The passcode is left intact (use DELETE /api/passcode to
// remove the lock entirely).
export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { error } = await supabase
      .from('habit_lock_credentials')
      .delete()
      .eq('user_id', user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to disable biometric'), 500);
    return ok({ hasBiometric: false });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to disable biometric'), 500);
  }
}
