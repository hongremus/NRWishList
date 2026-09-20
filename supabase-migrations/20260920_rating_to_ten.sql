-- One-time migration: convert existing 1-5 ratings to the new 1-10 scale.
-- Run this in the Supabase SQL Editor before testing existing completed wishes.
-- The migration marker makes this script safe to run again.

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
