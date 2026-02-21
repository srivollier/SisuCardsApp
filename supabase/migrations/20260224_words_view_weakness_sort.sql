-- Extend words_with_review_stats with id, verb_type, updated_at, and computed weakness
-- (same formula as front-end computeWeaknessScore)

create or replace view public.words_with_review_stats as
select
  w.id,
  w.user_id,
  w.fi,
  w.fr,
  w.verb_type,
  w.updated_at,
  coalesce(rs.reviews_count, 0) as reviews_count,
  coalesce(rs.correct_count, 0) as correct_count,
  coalesce(rs.incorrect_count, 0) as incorrect_count,
  coalesce(rs.streak, 0) as streak,
  rs.last_reviewed_at,
  (
    (coalesce(rs.incorrect_count, 0) + 1)::float / (coalesce(rs.correct_count, 0) + 1)
    + least(4, greatest(0, (
      case
        when rs.last_reviewed_at is null then 28
        else greatest(0, extract(epoch from (now() - rs.last_reviewed_at)) / 86400)
      end
    ) / 7))
    + case when coalesce(rs.reviews_count, 0) = 0 then 2 else 0 end
  ) as weakness
from public.words as w
left join public.review_stats as rs
  on rs.user_id = w.user_id
 and rs.card_id = w.id;
