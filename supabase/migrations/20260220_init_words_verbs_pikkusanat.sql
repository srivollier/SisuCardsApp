create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fi text not null,
  fr text,
  fi_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verbs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  infinitive_fi text not null,
  fr text,
  verb_type text,
  present_mina text,
  present_sina text,
  present_han text,
  present_me text,
  present_te text,
  present_he text,
  past_mina text,
  past_sina text,
  past_han text,
  past_me text,
  past_te text,
  past_he text,
  infinitive_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pikkusanat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pikkusana text not null,
  definition_fr text,
  example_fi text,
  example_fr text,
  pikkusana_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.words
  add constraint words_user_id_fi_key_unique unique (user_id, fi_key);

alter table public.verbs
  add constraint verbs_user_id_infinitive_key_unique unique (user_id, infinitive_key);

alter table public.pikkusanat
  add constraint pikkusanat_user_id_pikkusana_key_unique unique (user_id, pikkusana_key);

create or replace function public.words_before_write()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
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

create or replace function public.verbs_before_write()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  new.infinitive_fi := btrim(new.infinitive_fi);
  if new.infinitive_fi = '' then
    raise exception 'verbs.infinitive_fi cannot be empty';
  end if;

  new.infinitive_key := lower(btrim(new.infinitive_fi));
  if new.infinitive_key = '' then
    raise exception 'verbs.infinitive_key cannot be empty';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.pikkusanat_before_write()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  new.pikkusana := btrim(new.pikkusana);
  if new.pikkusana = '' then
    raise exception 'pikkusanat.pikkusana cannot be empty';
  end if;

  new.pikkusana_key := lower(btrim(new.pikkusana));
  if new.pikkusana_key = '' then
    raise exception 'pikkusanat.pikkusana_key cannot be empty';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_words_before_write on public.words;
create trigger trg_words_before_write
before insert or update on public.words
for each row
execute function public.words_before_write();

drop trigger if exists trg_verbs_before_write on public.verbs;
create trigger trg_verbs_before_write
before insert or update on public.verbs
for each row
execute function public.verbs_before_write();

drop trigger if exists trg_pikkusanat_before_write on public.pikkusanat;
create trigger trg_pikkusanat_before_write
before insert or update on public.pikkusanat
for each row
execute function public.pikkusanat_before_write();

drop trigger if exists trg_words_touch_updated_at on public.words;
create trigger trg_words_touch_updated_at
before update on public.words
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_verbs_touch_updated_at on public.verbs;
create trigger trg_verbs_touch_updated_at
before update on public.verbs
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_pikkusanat_touch_updated_at on public.pikkusanat;
create trigger trg_pikkusanat_touch_updated_at
before update on public.pikkusanat
for each row
execute function public.touch_updated_at();

alter table public.words enable row level security;
alter table public.verbs enable row level security;
alter table public.pikkusanat enable row level security;

create policy words_select_own
  on public.words
  for select
  using (user_id = auth.uid());

create policy words_insert_own
  on public.words
  for insert
  with check (user_id = auth.uid());

create policy words_update_own
  on public.words
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy words_delete_own
  on public.words
  for delete
  using (user_id = auth.uid());

create policy verbs_select_own
  on public.verbs
  for select
  using (user_id = auth.uid());

create policy verbs_insert_own
  on public.verbs
  for insert
  with check (user_id = auth.uid());

create policy verbs_update_own
  on public.verbs
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy verbs_delete_own
  on public.verbs
  for delete
  using (user_id = auth.uid());

create policy pikkusanat_select_own
  on public.pikkusanat
  for select
  using (user_id = auth.uid());

create policy pikkusanat_insert_own
  on public.pikkusanat
  for insert
  with check (user_id = auth.uid());

create policy pikkusanat_update_own
  on public.pikkusanat
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy pikkusanat_delete_own
  on public.pikkusanat
  for delete
  using (user_id = auth.uid());
