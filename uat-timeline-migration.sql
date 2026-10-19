-- UAT Timeline migration for NR Wish List.
-- Run this script once in the Supabase SQL Editor.

alter table public.calendar_events
  add column if not exists is_timeline boolean not null default false;

create index if not exists calendar_events_timeline_dates_idx
  on public.calendar_events (couple_id, is_timeline, start_date, end_date);

update public.calendar_events
set is_timeline = true
where couple_id = 'remus-nicole'
  and title in ('我哋紀念日', '3個月紀念日', '半年紀念日');

-- Existing calendar rows stay out of Timeline until explicitly checked as 足跡.
-- Example:
-- update public.calendar_events
-- set is_timeline = true
-- where couple_id = 'remus-nicole' and id = 'YOUR_EVENT_ID';
