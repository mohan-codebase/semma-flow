-- ============================================================
-- Habit Tracker Passcode Lock
-- ============================================================

-- Store the habit-lock passcode on the user's profile so the lock
-- follows the user across devices instead of living only in
-- browser localStorage.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS habits_passcode TEXT;

-- Covered by existing profiles RLS policies (auth.uid() = id).
