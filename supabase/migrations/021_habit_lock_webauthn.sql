-- ============================================================
-- Habit Lock — WebAuthn (Face ID / Touch ID) credentials
-- ============================================================
-- Biometric unlock for the habits sub-app. The user is already
-- authenticated via Supabase; these credentials gate the habits
-- section as a second, local factor. Public keys live here so the
-- lock can follow the user across their synced-passkey devices,
-- while the hashed passcode (profiles.habits_passcode) remains the
-- cross-device fallback / recovery method.

CREATE TABLE IF NOT EXISTS public.habit_lock_credentials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,           -- base64url credential ID
  public_key    TEXT NOT NULL,                  -- base64url COSE public key
  counter       BIGINT NOT NULL DEFAULT 0,      -- signature counter (replay guard)
  transports    TEXT[],                         -- e.g. {internal,hybrid}
  device_label  TEXT,                           -- optional human-readable label
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS habit_lock_credentials_user_id_idx
  ON public.habit_lock_credentials (user_id);

ALTER TABLE public.habit_lock_credentials ENABLE ROW LEVEL SECURITY;

-- Owner-only access, matching the trip_* convention (auth.uid() = user_id).
DO $$ BEGIN
  CREATE POLICY "owner_habit_lock_credentials"
    ON public.habit_lock_credentials
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Passcode hardening ──────────────────────────────────────
-- profiles.habits_passcode now stores a salted scrypt hash (format
-- "scrypt$<salt>$<hash>"), not the raw code. Wipe any pre-existing
-- plaintext value so it is re-set through the new hashed path. The
-- guard makes this safe to re-run (already-hashed values are kept).
UPDATE public.profiles
SET habits_passcode = NULL
WHERE habits_passcode IS NOT NULL
  AND habits_passcode NOT LIKE 'scrypt$%';
