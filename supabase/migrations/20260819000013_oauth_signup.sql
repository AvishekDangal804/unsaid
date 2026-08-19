-- OAuth providers (Facebook, etc.) don't supply a username or date of
-- birth, so handle_new_user() can no longer require them unconditionally.
-- OAuth signups instead get a placeholder username and are flagged for
-- a mandatory finish-signup step (checked in the app layout) before they
-- can use the rest of the app.

insert into public.reserved_usernames (username) values
  ('finish-signup'), ('callback')
on conflict (username) do nothing;

alter table public.profiles
  add column oauth_setup_pending boolean not null default false;

-- OAuth signups reach finish-signup already authenticated with no
-- account_private row yet (the trigger skips it when dob is missing),
-- so they need to insert their own row directly — the original
-- migration only ever anticipated the security-definer trigger path.
create policy "users can insert own private account data"
  on public.account_private for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  chosen_username citext;
  chosen_dob date;
  chosen_display_name text;
  is_oauth boolean := false;
  candidate citext;
  suffix int := 0;
begin
  chosen_username := new.raw_user_meta_data ->> 'username';
  chosen_dob := (new.raw_user_meta_data ->> 'date_of_birth')::date;

  if chosen_username is null or chosen_username = '' or chosen_dob is null then
    is_oauth := true;
  end if;

  if not is_oauth and exists (
    select 1 from public.reserved_usernames r where r.username = chosen_username
  ) then
    raise exception 'username is reserved';
  end if;

  if is_oauth then
    candidate := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
    while exists (select 1 from public.profiles p where p.username = candidate)
       or exists (select 1 from public.reserved_usernames r where r.username = candidate) loop
      suffix := suffix + 1;
      candidate := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10) || suffix::text;
    end loop;
    chosen_username := candidate;
    chosen_display_name := coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      chosen_username::text
    );
  else
    chosen_display_name := chosen_username::text;
  end if;

  insert into public.profiles (id, username, display_name, avatar_url, oauth_setup_pending)
  values (new.id, chosen_username, chosen_display_name, new.raw_user_meta_data ->> 'avatar_url', is_oauth);

  if not is_oauth then
    insert into public.account_private (id, date_of_birth) values (new.id, chosen_dob);
  end if;

  return new;
end;
$$;
