-- Run once in Supabase SQL Editor.
-- Converts existing 1-5 ratings to 1-10. Do not run it again.

update public.wishes as w
set history = coalesce((
  select jsonb_agg(
    jsonb_set_lax(
      jsonb_set_lax(
        jsonb_set_lax(
          item,
          '{ratings,me}',
          to_jsonb(least(
            case when (item #>> '{ratings,me}')::numeric <= 5
              then (item #>> '{ratings,me}')::numeric * 2
              else (item #>> '{ratings,me}')::numeric
            end,
            10
          )),
          true,
          'return_target'
        ),
        '{ratings,gf}',
        to_jsonb(least(
          case when (item #>> '{ratings,gf}')::numeric <= 5
            then (item #>> '{ratings,gf}')::numeric * 2
            else (item #>> '{ratings,gf}')::numeric
          end,
          10
        )),
        true,
        'return_target'
      ),
      '{averageRating}',
      to_jsonb(least(
        case when (item->>'averageRating')::numeric <= 5
          then (item->>'averageRating')::numeric * 2
          else (item->>'averageRating')::numeric
        end,
        10
      )),
      true,
      'return_target'
    )
  )
  from jsonb_array_elements(w.history) as entry(item)
), '[]'::jsonb)
where jsonb_typeof(w.history) = 'array';
