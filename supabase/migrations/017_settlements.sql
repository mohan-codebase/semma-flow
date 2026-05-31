-- ============================================================
-- Migration: Recorded settlements ("settle up")
-- When one traveler pays another to clear a pending balance, we record it here.
-- The app subtracts these from the computed balances so settled debts stop
-- showing. User-scoped + owner RLS, like the rest of the trip tables.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trip_settlements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id     UUID REFERENCES public.trip_trips(id) ON DELETE CASCADE NOT NULL,
  from_person TEXT NOT NULL,
  to_person   TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_settlements_trip ON public.trip_settlements (trip_id);

ALTER TABLE public.trip_settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_trip_settlements" ON public.trip_settlements;
CREATE POLICY "owner_trip_settlements" ON public.trip_settlements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.trip_settlements REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_settlements;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
