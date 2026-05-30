-- ============================================================
-- AI coach insight cache — one row per user per ISO week.
-- Lets us call the model at most once per user per week.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_insights_select" ON public.ai_insights;
CREATE POLICY "ai_insights_select" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_insights_insert" ON public.ai_insights;
CREATE POLICY "ai_insights_insert" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_insights_update" ON public.ai_insights;
CREATE POLICY "ai_insights_update" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_insights_delete" ON public.ai_insights;
CREATE POLICY "ai_insights_delete" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);
