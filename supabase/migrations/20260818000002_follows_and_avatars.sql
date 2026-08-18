insert into public.reserved_usernames (username) values
  ('explore'), ('notifications'), ('messages'), ('communities'), ('saved'),
  ('terms'), ('privacy'), ('help'), ('settings'), ('login'), ('signup'),
  ('forgot-password'), ('reset-password'), ('auth'), ('trending'), ('search'),
  ('requests'), ('followers'), ('following'), ('create')
on conflict (username) do nothing;

create table public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'accepted' check (status in ('accepted', 'pending')),
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index follows_following_idx on public.follows (following_id, status);
create index follows_follower_idx on public.follows (follower_id, status);

alter table public.follows enable row level security;

create policy "accepted follows are public, pending visible to participants"
  on public.follows for select
  using (status = 'accepted' or auth.uid() = follower_id or auth.uid() = following_id);

create policy "users can create their own follow rows"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "target can update status of incoming requests"
  on public.follows for update
  using (auth.uid() = following_id)
  with check (auth.uid() = following_id);

create policy "follower or target can delete a follow row"
  on public.follows for delete
  using (auth.uid() = follower_id or auth.uid() = following_id);

create or replace function public.set_follow_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_private boolean;
begin
  select is_private into target_private from public.profiles where id = new.following_id;
  new.status := case when target_private then 'pending' else 'accepted' end;
  return new;
end;
$$;

create trigger follows_set_status
  before insert on public.follows
  for each row execute function public.set_follow_status();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
