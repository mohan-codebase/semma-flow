-- ============================================================
-- Migration: Per-expense multiple payers
-- Lets more than one traveler pay toward a single expense. When set, this maps
-- each payer to the amount they paid (the values sum to `amount`). null means a
-- single payer, identified by `paid_by` (the existing behaviour).
-- ============================================================

ALTER TABLE public.trip_expenses
  ADD COLUMN IF NOT EXISTS paid_by_amounts JSONB;
