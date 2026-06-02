import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// The habit-lock passcode is stored as a salted scrypt hash rather than
// plaintext. Format: "scrypt$<saltBase64url>$<hashBase64url>".
//
// Note: a short numeric PIN is inherently low-entropy, so this mainly
// removes the plaintext-at-rest problem (DB dumps, localStorage) — it is
// not a defense against an offline brute force of a 4-digit code. The lock
// is a soft gate on the user's own data, so that trade-off is acceptable.
const PREFIX = 'scrypt';
const KEYLEN = 64;
const SALT_BYTES = 16;

export function hashPasscode(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(plain, salt, KEYLEN);
  return `${PREFIX}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPasscode(plain: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.startsWith(`${PREFIX}$`)) return false;
  const [, saltB64, hashB64] = stored.split('$');
  if (!saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = scryptSync(plain, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
