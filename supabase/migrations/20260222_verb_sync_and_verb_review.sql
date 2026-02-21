-- Part 1: Sync verb infinitives to words (trigger + backfill)
-- Part 2: verb_review_stats table + RPC record_verb_review

-- Allow words.user_id to be set by caller when auth.uid() is null (e.g. backfill)
create or replace function public.words_before_write()
returns trigger
language plpgsql
as $$
begin
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.fi := btrim(new.fi);
  if new.fi = '' then
    raise exception 'words.fi cannot be empty';
  end if;

  new.fi_key := lower(btrim(new.fi));
  if new.fi_key = '' then
    raise exception 'words.fi_key cannot be empty';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- ----- Part 1: Trigger: on verb insert/update, upsert into words -----
create or replace function public.sync_verb_infinitive_to_words()
returns trigger
language plpgsql
as $$
declare
  v_user_id uuid;
  v_fi text;
  v_fr text;
  v_fi_key text;
begin
  v_user_id := coalesce(new.user_id, auth.uid());
  v_fi := btrim(new.infinitive_fi);
  v_fr := new.fr;
  v_fi_key := lower(btrim(new.infinitive_fi));

  if v_fi = '' or v_fi_key = '' then
    return new;
  end if;

  insert into public.words (user_id, fi, fr, fi_key)
  values (v_user_id, v_fi, v_fr, v_fi_key)
  on conflict (user_id, fi_key)
  do update set
    fi = excluded.fi,
    fr = excluded.fr,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_verbs_sync_to_words on public.verbs;
create trigger trg_verbs_sync_to_words
after insert or update of infinitive_fi, fr on public.verbs
for each row
execute function public.sync_verb_infinitive_to_words();

-- Backfill: existing verbs -> words
insert into public.words (user_id, fi, fr, fi_key)
select
  v.user_id,
  btrim(v.infinitive_fi),
  v.fr,
  lower(btrim(v.infinitive_fi))
from public.verbs as v
on conflict (user_id, fi_key)
do update set
  fi = excluded.fi,
  fr = excluded.fr,
  updated_at = now();

-- ----- Part 2: verb_review_stats -----
create table if not exists public.verb_review_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  verb_id uuid not null references public.verbs(id) on delete cascade,
  reviews_count integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  streak integer not null default 0,
  last_reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verb_review_stats_user_verb_unique unique (user_id, verb_id)
);

create or replace function public.verb_review_stats_before_write()
returns trigger
language plpgsql
as $$
begin
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_verb_review_stats_before_write on public.verb_review_stats;
create trigger trg_verb_review_stats_before_write
before insert or update on public.verb_review_stats
for each row
execute function public.verb_review_stats_before_write();

alter table public.verb_review_stats enable row level security;

drop policy if exists verb_review_stats_select_own on public.verb_review_stats;
create policy verb_review_stats_select_own
  on public.verb_review_stats
  for select
  using (user_id = auth.uid());

drop policy if exists verb_review_stats_insert_own on public.verb_review_stats;
create policy verb_review_stats_insert_own
  on public.verb_review_stats
  for insert
  with check (user_id = auth.uid());

drop policy if exists verb_review_stats_update_own on public.verb_review_stats;
create policy verb_review_stats_update_own
  on public.verb_review_stats
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists verb_review_stats_delete_own on public.verb_review_stats;
create policy verb_review_stats_delete_own
  on public.verb_review_stats
  for delete
  using (user_id = auth.uid());

-- RPC: record_verb_review(verb_id, result)
create or replace function public.record_verb_review(p_verb_id uuid, p_result text)
returns void
language plpgsql
security invoker
as $$
declare
  normalized_result text;
begin
  if auth.uid() is null then
    raise exception 'record_verb_review must be called by an authenticated user context';
  end if;

  normalized_result := lower(btrim(p_result));
  if normalized_result not in ('correct', 'incorrect') then
    raise exception 'Invalid result: %, expected correct or incorrect', p_result;
  end if;

  if not exists (
    select 1
    from public.verbs
    where id = p_verb_id
      and user_id = auth.uid()
  ) then
    raise exception 'Verb not found for current user';
  end if;

  insert into public.verb_review_stats (
    user_id,
    verb_id,
    reviews_count,
    correct_count,
    incorrect_count,
    streak,
    last_reviewed_at
  )
  values (
    auth.uid(),
    p_verb_id,
    1,
    case when normalized_result = 'correct' then 1 else 0 end,
    case when normalized_result = 'incorrect' then 1 else 0 end,
    case when normalized_result = 'correct' then 1 else 0 end,
    now()
  )
  on conflict (user_id, verb_id)
  do update set
    reviews_count = public.verb_review_stats.reviews_count + 1,
    correct_count = public.verb_review_stats.correct_count
      + case when normalized_result = 'correct' then 1 else 0 end,
    incorrect_count = public.verb_review_stats.incorrect_count
      + case when normalized_result = 'incorrect' then 1 else 0 end,
    streak = case
      when normalized_result = 'correct' then public.verb_review_stats.streak + 1
      else 0
    end,
    last_reviewed_at = now(),
    updated_at = now();
end;
$$;
