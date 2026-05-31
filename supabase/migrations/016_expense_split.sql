-- ============================================================
-- Migration: Per-expense split
-- Lets an expense paid by one person be shared among a chosen subset of
-- travelers (e.g. one person pays for both). NULL / empty means "split among
-- all of the trip's travelers" — the app interprets it that way, so existing
-- rows need no backfill and stay equal-split.
-- ============================================================

ALTER TABLE public.trip_expenses
  ADD COLUMN IF NOT EXISTS split_between TEXT[];
