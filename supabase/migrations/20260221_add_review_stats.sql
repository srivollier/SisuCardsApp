create table if not exists public.review_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id uuid not null references public.words(id) on delete cascade,
  reviews_count integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  streak integer not null default 0,
  last_reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_stats_user_card_unique unique (user_id, card_id)
);

create or replace function public.review_stats_before_write()
returns trigger
language plpgsql
as $$
begin
  -- In SQL editor/manual migrations auth.uid() can be null; keep explicit user_id in that case.
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_review_stats_before_write on public.review_stats;
create trigger trg_review_stats_before_write
before insert or update on public.review_stats
for each row
execute function public.review_stats_before_write();

alter table public.review_stats enable row level security;

create policy review_stats_select_own
  on public.review_stats
  for select
  using (user_id = auth.uid());

create policy review_stats_insert_own
  on public.review_stats
  for insert
  with check (user_id = auth.uid());

create policy review_stats_update_own
  on public.review_stats
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy review_stats_delete_own
  on public.review_stats
  for delete
  using (user_id = auth.uid());

create or replace function public.ensure_review_stats_for_word()
returns trigger
language plpgsql
as $$
begin
  insert into public.review_stats (user_id, card_id)
  values (new.user_id, new.id)
  on conflict (user_id, card_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_words_ensure_review_stats on public.words;
create trigger trg_words_ensure_review_stats
after insert on public.words
for each row
execute function public.ensure_review_stats_for_word();

insert into public.review_stats (user_id, card_id)
select w.user_id, w.id
from public.words as w
left join public.review_stats as rs
  on rs.user_id = w.user_id
 and rs.card_id = w.id
where rs.id is null;

create or replace view public.words_with_review_stats as
select
  w.id as card_id,
  w.user_id,
  w.fi,
  w.fr,
  coalesce(rs.reviews_count, 0) as reviews_count,
  coalesce(rs.correct_count, 0) as correct_count,
  coalesce(rs.incorrect_count, 0) as incorrect_count,
  coalesce(rs.streak, 0) as streak,
  rs.last_reviewed_at
from public.words as w
left join public.review_stats as rs
  on rs.user_id = w.user_id
 and rs.card_id = w.id;

create or replace function public.record_review(card_id uuid, result text)
returns void
language plpgsql
security invoker
as $$
declare
  p_card_id alias for $1;
  p_result alias for $2;
  normalized_result text;
begin
  normalized_result := lower(btrim(p_result));
  if normalized_result not in ('correct', 'incorrect') then
    raise exception 'Invalid result: %, expected correct or incorrect', p_result;
  end if;

  if not exists (
    select 1
    from public.words
    where id = p_card_id
      and user_id = auth.uid()
  ) then
    raise exception 'Card not found for current user';
  end if;

  insert into public.review_stats (
    user_id,
    card_id,
    reviews_count,
    correct_count,
    incorrect_count,
    streak,
    last_reviewed_at
  )
  values (
    auth.uid(),
    p_card_id,
    1,
    case when normalized_result = 'correct' then 1 else 0 end,
    case when normalized_result = 'incorrect' then 1 else 0 end,
    case when normalized_result = 'correct' then 1 else 0 end,
    now()
  )
  on conflict (user_id, card_id)
  do update set
    reviews_count = public.review_stats.reviews_count + 1,
    correct_count = public.review_stats.correct_count
      + case when normalized_result = 'correct' then 1 else 0 end,
    incorrect_count = public.review_stats.incorrect_count
      + case when normalized_result = 'incorrect' then 1 else 0 end,
    streak = case
      when normalized_result = 'correct' then public.review_stats.streak + 1
      else 0
    end,
    last_reviewed_at = now(),
    updated_at = now();
end;
$$;
