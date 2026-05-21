-- ============================================================
-- Add Bad Habits Feature
-- ============================================================

-- Add is_bad_habit column to habits table
ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS is_bad_habit BOOLEAN DEFAULT false;

-- Update habits row level security policies (already covered by existing policies)
