-- ============================================================
-- Migration: Multiple Trips & Dynamic Travelers
-- ============================================================

-- 1. Remove the unique constraint from trip_trips(user_id) so each user can have multiple trips
ALTER TABLE public.trip_trips DROP CONSTRAINT IF EXISTS trip_trips_user_id_key;

-- 2. Add travelers array column to trip_trips (defaulting to Mohan & Charles)
ALTER TABLE public.trip_trips ADD COLUMN IF NOT EXISTS travelers TEXT[] NOT NULL DEFAULT ARRAY['Mohan', 'Charles'];

-- 3. Add trip_id column to other tables to link them to specific trips
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trip_trips(id) ON DELETE CASCADE;
ALTER TABLE public.trip_bookings ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trip_trips(id) ON DELETE CASCADE;
ALTER TABLE public.trip_itinerary ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trip_trips(id) ON DELETE CASCADE;
ALTER TABLE public.trip_packing_items ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trip_trips(id) ON DELETE CASCADE;
ALTER TABLE public.trip_documents ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trip_trips(id) ON DELETE CASCADE;

-- 4. Backfill trip_id for existing records
-- Since there was at most one trip per user, we can associate user_id's records with that user's trip id.
UPDATE public.trip_expenses e
SET trip_id = t.id
FROM public.trip_trips t
WHERE e.user_id = t.user_id AND e.trip_id IS NULL;

UPDATE public.trip_bookings b
SET trip_id = t.id
FROM public.trip_trips t
WHERE b.user_id = t.user_id AND b.trip_id IS NULL;

UPDATE public.trip_itinerary i
SET trip_id = t.id
FROM public.trip_trips t
WHERE i.user_id = t.user_id AND i.trip_id IS NULL;

UPDATE public.trip_packing_items p
SET trip_id = t.id
FROM public.trip_trips t
WHERE p.user_id = t.user_id AND p.trip_id IS NULL;

UPDATE public.trip_documents d
SET trip_id = t.id
FROM public.trip_trips t
WHERE d.user_id = t.user_id AND d.trip_id IS NULL;

-- 5. Handle any orphaned records (where user has expenses but no trip exists yet)
DO $$
DECLARE
  r RECORD;
  new_trip_id UUID;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.trip_expenses WHERE trip_id IS NULL
  LOOP
    INSERT INTO public.trip_trips (user_id, name, start_date, end_date, total_budget)
    VALUES (r.user_id, 'My Ladakh Trip', CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '3 months' + INTERVAL '9 days', 80000)
    ON CONFLICT DO NOTHING
    RETURNING id INTO new_trip_id;

    IF new_trip_id IS NULL THEN
      SELECT id INTO new_trip_id FROM public.trip_trips WHERE user_id = r.user_id LIMIT 1;
    END IF;

    UPDATE public.trip_expenses SET trip_id = new_trip_id WHERE user_id = r.user_id AND trip_id IS NULL;
    UPDATE public.trip_bookings SET trip_id = new_trip_id WHERE user_id = r.user_id AND trip_id IS NULL;
    UPDATE public.trip_itinerary SET trip_id = new_trip_id WHERE user_id = r.user_id AND trip_id IS NULL;
    UPDATE public.trip_packing_items SET trip_id = new_trip_id WHERE user_id = r.user_id AND trip_id IS NULL;
    UPDATE public.trip_documents SET trip_id = new_trip_id WHERE user_id = r.user_id AND trip_id IS NULL;
  END LOOP;
END $$;

-- 6. Enforce NOT NULL constraint on trip_id columns now that they are fully populated
ALTER TABLE public.trip_expenses ALTER COLUMN trip_id SET NOT NULL;
ALTER TABLE public.trip_bookings ALTER COLUMN trip_id SET NOT NULL;
ALTER TABLE public.trip_itinerary ALTER COLUMN trip_id SET NOT NULL;
ALTER TABLE public.trip_packing_items ALTER COLUMN trip_id SET NOT NULL;
ALTER TABLE public.trip_documents ALTER COLUMN trip_id SET NOT NULL;

-- 7. Drop check constraints checking 'Mohan' or 'Charles' on paid_by column
ALTER TABLE public.trip_expenses DROP CONSTRAINT IF EXISTS trip_expenses_paid_by_check;
ALTER TABLE public.trip_bookings DROP CONSTRAINT IF EXISTS trip_bookings_paid_by_check;
