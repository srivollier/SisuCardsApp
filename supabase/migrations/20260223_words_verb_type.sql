-- Add verb_type to words and sync from verbs (for display e.g. "ajaa (1)" in Words section)

alter table public.words add column if not exists verb_type text;

-- Update sync to copy verb_type
create or replace function public.sync_verb_infinitive_to_words()
returns trigger
language plpgsql
as $$
declare
  v_user_id uuid;
  v_fi text;
  v_fr text;
  v_fi_key text;
  v_verb_type text;
begin
  v_user_id := coalesce(new.user_id, auth.uid());
  v_fi := btrim(new.infinitive_fi);
  v_fr := new.fr;
  v_fi_key := lower(btrim(new.infinitive_fi));
  v_verb_type := new.verb_type;

  if v_fi = '' or v_fi_key = '' then
    return new;
  end if;

  insert into public.words (user_id, fi, fr, fi_key, verb_type)
  values (v_user_id, v_fi, v_fr, v_fi_key, v_verb_type)
  on conflict (user_id, fi_key)
  do update set
    fi = excluded.fi,
    fr = excluded.fr,
    verb_type = excluded.verb_type,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_verbs_sync_to_words on public.verbs;
create trigger trg_verbs_sync_to_words
after insert or update of infinitive_fi, fr, verb_type on public.verbs
for each row
execute function public.sync_verb_infinitive_to_words();

-- Backfill verb_type for existing words that match a verb
update public.words w
set verb_type = v.verb_type
from public.verbs v
where w.user_id = v.user_id
  and w.fi_key = lower(btrim(v.infinitive_fi));
