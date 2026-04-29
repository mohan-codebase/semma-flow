-- 003_replica_identity_full.sql
-- Enable full OLD row payload for habit_entries DELETE events so realtime
-- consumers can filter by entry_date. Slightly increases WAL volume; acceptable
-- for the row volume on this table.
ALTER TABLE public.habit_entries REPLICA IDENTITY FULL;
