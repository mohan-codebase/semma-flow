-- ============================================================
-- 008 — Lock down legacy `todos` table + add server helpers
-- ============================================================
--
-- The `todos` table from migration 002 was created with a
-- public RLS policy ("Allow public access to todos") that lets
-- ANY anon caller read, write, or delete every row. The table
-- is no longer referenced by app code, but the row policy and
-- table itself remain — anyone with the anon key (which ships
-- to the browser) can still hit it.
--
-- This migration:
--   1. Drops the dangerous policy.
--   2. Drops the table outright (no production data, demo only).
--   3. Adds a SQL function for atomic habit reordering.
--   4. Backstops the auth.uid() = user_id check at the DB layer
--      for habit reorder so a compromised client can't reshuffle
--      another user's habits.

-- 1) Remove the public-everything policy (safety even if drop fails)
DROP POLICY IF EXISTS "Allow public access to todos" ON public.todos;

-- 2) Drop the demo table itself (cascades to nothing — table is unreferenced)
DROP TABLE IF EXISTS public.todos;

-- 3) Atomic bulk reorder. Single round-trip + SECURITY DEFINER scoped to the
--    caller via auth.uid(). Replaces the parallel-update loop in /api/habits/reorder
--    which had no transactional guarantees.
CREATE OR REPLACE FUNCTION public.reorder_habits(p_habit_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update sort_order for every habit in the array, but ONLY if it belongs to
  -- the caller. Habits the caller doesn't own are silently skipped — no row
  -- enumeration leak.
  UPDATE public.habits h
  SET    sort_order = idx.position - 1,
         updated_at = now()
  FROM   unnest(p_habit_ids) WITH ORDINALITY AS idx(habit_id, position)
  WHERE  h.id = idx.habit_id
    AND  h.user_id = v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_habits(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_habits(UUID[]) TO authenticated;

-- 4) Helpful index for /api/cron/reminders — currently scans habits with a
--    non-null reminder_time. Adds partial index so the cron query is O(matched).
CREATE INDEX IF NOT EXISTS idx_habits_reminder_active
  ON public.habits (reminder_time)
  WHERE is_archived = false AND reminder_time IS NOT NULL;
