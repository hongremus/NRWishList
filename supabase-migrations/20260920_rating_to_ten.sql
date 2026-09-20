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
          to_jsonb(least(((item #>> '{ratings,me}')::numeric) * 2, 10)),
          true,
          'return_target'
        ),
        '{ratings,gf}',
        to_jsonb(least(((item #>> '{ratings,gf}')::numeric) * 2, 10)),
        true,
        'return_target'
      ),
      '{averageRating}',
      to_jsonb(least(((item->>'averageRating')::numeric) * 2, 10)),
      true,
      'return_target'
    )
  )
  from jsonb_array_elements(w.history) as entry(item)
), '[]'::jsonb)
where jsonb_typeof(w.history) = 'array';
