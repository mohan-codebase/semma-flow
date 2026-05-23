-- Add challenge_days to habits table
-- Stores the user's chosen challenge duration (e.g. 7, 21, 30, 66, 90 days)
ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS challenge_days INTEGER;
