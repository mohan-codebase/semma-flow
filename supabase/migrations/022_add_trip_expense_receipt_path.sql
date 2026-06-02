-- Migration to add receipt_path to trip_expenses
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS receipt_path TEXT DEFAULT NULL;
