-- NR Wish List performance indexes
-- Safe to run repeatedly in Supabase SQL Editor.

create index if not exists wishes_couple_created_at_idx
  on public.wishes (couple_id, created_at desc);

create index if not exists calendar_events_couple_dates_idx
  on public.calendar_events (couple_id, start_date, start_time);

create index if not exists calendar_events_couple_end_date_idx
  on public.calendar_events (couple_id, end_date);
