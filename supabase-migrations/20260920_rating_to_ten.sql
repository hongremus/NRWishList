
-- Run once in Supabase SQL Editor to convert existing 1-5 ratings to 1-10.
-- Do not run this again after the scores have been converted.

update public.wishes as wish
set history = (
  select jsonb_agg(average_value.value)
  from jsonb_array_elements(wish.history) as raw(value)
  cross join lateral (
    select case
      when raw.value #>> '{ratings,me}' is not null then jsonb_set(
        raw.value,
        '{ratings,me}',
        to_jsonb(least((raw.value #>> '{ratings,me}')::numeric * 2, 10)),
        true
      )
      else raw.value
    end as value
  ) as me_value
  cross join lateral (
    select case
      when me_value.value #>> '{ratings,gf}' is not null then jsonb_set(
        me_value.value,
        '{ratings,gf}',
        to_jsonb(least((me_value.value #>> '{ratings,gf}')::numeric * 2, 10)),
        true
      )
      else me_value.value
    end as value
  ) as gf_value
  cross join lateral (
    select case
      when gf_value.value->>'averageRating' is not null then jsonb_set(
        gf_value.value,
        '{averageRating}',
        to_jsonb(least((gf_value.value->>'averageRating')::numeric * 2, 10)),
        true
      )
      else gf_value.value
    end as value
  ) as average_value
)
where jsonb_typeof(wish.history) = 'array';

create table if not exists public.app_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

do $$
declare
  wish_record record;
  history_item jsonb;
  converted_history jsonb;
begin
  if not exists (
    select 1 from public.app_migrations
    where id = '20260920_rating_to_ten'
  ) then
    for wish_record in
      select id, history
      from public.wishes
      where jsonb_typeof(history) = 'array'
    loop
      converted_history := '[]'::jsonb;

      for history_item in
        select value from jsonb_array_elements(wish_record.history)
      loop
        if jsonb_typeof(history_item #> '{ratings,me}') = 'number' then
          history_item := jsonb_set(
            history_item,
            '{ratings,me}',
            to_jsonb(least((history_item #>> '{ratings,me}')::numeric * 2, 10)),
            true
          );
        end if;

        if jsonb_typeof(history_item #> '{ratings,gf}') = 'number' then
          history_item := jsonb_set(
            history_item,
            '{ratings,gf}',
            to_jsonb(least((history_item #>> '{ratings,gf}')::numeric * 2, 10)),
            true
          );
        end if;

        if jsonb_typeof(history_item->'averageRating') = 'number' then
          history_item := jsonb_set(
            history_item,
            '{averageRating}',
            to_jsonb(least((history_item->>'averageRating')::numeric * 2, 10)),
            true
          );
        end if;

        converted_history := converted_history || jsonb_build_array(history_item);
      end loop;

      update public.wishes
      set history = converted_history
      where id = wish_record.id;
    end loop;

    insert into public.app_migrations (id)
    values ('20260920_rating_to_ten');
  end if;
end $$;
