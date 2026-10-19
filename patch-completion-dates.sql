-- Patch completion dates for two existing wishes.
-- Dates are interpreted as DD/MM/YYYY and stored at 12:00 Hong Kong time.
-- Run in the Supabase SQL Editor, then refresh NR Wish List.

begin;

with requested(title, completed_at) as (
  values
    ('好鍋日子', '2026-09-12 12:00:00+08'::timestamptz),
    ('有料案內所', '2026-09-12 12:00:00+08'::timestamptz),
    ('頂立料理所', '2026-10-18 12:00:00+08'::timestamptz)
), latest_history as (
  select
    wm.id as wish_id,
    wh.id as history_id,
    requested.completed_at,
    row_number() over (
      partition by wm.id
      order by wh.completed_at desc, wh.id desc
    ) as row_number
  from public."wishMaster" wm
  join public."wishHistory" wh on wh.wish_id = wm.id
  join requested on requested.title = wm.title
  where wm.couple_id = 'remus-nicole'
    and wh.couple_id = 'remus-nicole'
)
update public."wishHistory" wh
set completed_at = latest_history.completed_at
from latest_history
where latest_history.row_number = 1
  and wh.id = latest_history.history_id
  and wh.wish_id = latest_history.wish_id
returning wh.wish_id, wh.id as history_id, wh.completed_at;

commit;
