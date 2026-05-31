-- ============================================================
-- Migration: Per-expense settled flag
-- Lets a single expense be marked as settled/paid (the non-payer reimbursed
-- the payer for their share). Settled expenses drop out of the *pending*
-- balance, independent of the aggregate trip_settlements records.
-- ============================================================

ALTER TABLE public.trip_expenses
  ADD COLUMN IF NOT EXISTS settled BOOLEAN NOT NULL DEFAULT FALSE;
