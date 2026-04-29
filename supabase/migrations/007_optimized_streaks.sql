-- ============================================================
-- Optimized Streak Calculation (Gaps and Islands)
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_streak(p_habit_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- We use a CTE to find the continuous group of completed days
  -- that includes either today or yesterday.
  WITH completed_dates AS (
    SELECT entry_date
    FROM public.habit_entries
    WHERE habit_id = p_habit_id 
      AND user_id = p_user_id 
      AND is_completed = true
    ORDER BY entry_date DESC
  ),
  date_groups AS (
    SELECT 
      entry_date,
      entry_date - (ROW_NUMBER() OVER (ORDER BY entry_date DESC))::INT as grp
    FROM completed_dates
  ),
  target_group AS (
    SELECT grp
    FROM date_groups
    WHERE entry_date = v_today OR entry_date = (v_today - 1)
    LIMIT 1
  )
  SELECT COUNT(*) INTO v_streak
  FROM date_groups
  WHERE grp = (SELECT grp FROM target_group);

  -- Update the habit record cache
  UPDATE public.habits
  SET 
    current_streak = COALESCE(v_streak, 0),
    longest_streak = GREATEST(longest_streak, COALESCE(v_streak, 0)),
    total_completions = (
      SELECT COUNT(*) 
      FROM public.habit_entries 
      WHERE habit_id = p_habit_id AND is_completed = true
    ),
    updated_at = now()
  WHERE id = p_habit_id AND user_id = p_user_id;

  RETURN COALESCE(v_streak, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update streaks when entries change
CREATE OR REPLACE FUNCTION public.refresh_habit_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.calculate_streak(NEW.habit_id, NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_refresh_habit_stats ON public.habit_entries;
CREATE TRIGGER tr_refresh_habit_stats
  AFTER INSERT OR UPDATE OF is_completed ON public.habit_entries
  FOR EACH ROW
  EXECUTE PROCEDURE public.refresh_habit_stats();
