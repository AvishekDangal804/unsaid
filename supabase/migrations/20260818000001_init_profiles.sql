-- Phase 1: profiles + private account data + signup trigger
-- Public profile data lives in `profiles`. Sensitive data (date of birth) lives
-- in `account_private` so it is never exposed through a public-read policy.

create extension if not exists "citext";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique,
  display_name text,
  bio text,
  avatar_url text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username::text) between 3 and 24),
  constraint username_format check (username::text ~ '^[a-zA-Z0-9_]+$')
);

create index profiles_username_idx on public.profiles (username);

create table public.reserved_usernames (
  username citext primary key
);

insert into public.reserved_usernames (username) values
  ('admin'), ('administrator'), ('unsaid'), ('support'), ('moderator'),
  ('mod'), ('system'), ('root'), ('help'), ('official'), ('staff'),
  ('security'), ('null'), ('undefined'), ('api'), ('settings');

create table public.account_private (
  id uuid primary key references auth.users (id) on delete cascade,
  date_of_birth date not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.reserved_usernames enable row level security;
alter table public.account_private enable row level security;

-- profiles: publicly readable, only the owner can write
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- account_private: only the owner may ever read/write their own row
create policy "users can view own private account data"
  on public.account_private for select
  using (auth.uid() = id);

create policy "users can update own private account data"
  on public.account_private for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- reserved_usernames: readable by anyone (needed for client-side availability checks), never writable by users
create policy "reserved usernames are publicly readable"
  on public.reserved_usernames for select
  using (true);

-- Auto-create profile + private row on signup, from metadata passed at sign-up time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  chosen_username citext;
  chosen_dob date;
begin
  chosen_username := new.raw_user_meta_data ->> 'username';
  chosen_dob := (new.raw_user_meta_data ->> 'date_of_birth')::date;

  if chosen_username is null or chosen_username = '' then
    raise exception 'username is required';
  end if;

  if exists (select 1 from public.reserved_usernames r where r.username = chosen_username) then
    raise exception 'username is reserved';
  end if;

  if chosen_dob is null then
    raise exception 'date_of_birth is required';
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, chosen_username, chosen_username);

  insert into public.account_private (id, date_of_birth)
  values (new.id, chosen_dob);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
