insert into public.reserved_usernames (username) values
  ('notifications'), ('notification')
on conflict (username) do nothing;

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reactions boolean not null default true,
  comments boolean not null default true,
  replies boolean not null default true,
  follows boolean not null default true,
  mentions boolean not null default true,
  quiet_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "users can view their own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "users can update their own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.create_default_notification_preferences()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger profiles_create_notification_preferences
  after insert on public.profiles
  for each row execute function public.create_default_notification_preferences();

insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete cascade,
  is_anonymous_actor boolean not null default false,
  type text not null check (type in (
    'follow', 'follow_request', 'follow_accepted',
    'reaction_post', 'reaction_comment',
    'comment', 'reply',
    'mention_post', 'mention_comment',
    'system'
  )),
  target_type text check (target_type in ('post', 'comment', 'profile')),
  target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

alter table public.notifications enable row level security;

create policy "users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = recipient_id);

-- Notifications are always written through this function rather than a
-- direct INSERT policy: actor_id comes from auth.uid() inside the function
-- (never trusted from a parameter, so no one can forge who triggered an
-- event), self-notifications are skipped, and the recipient's preferences
-- are checked server-side without needing a public-read policy on
-- notification_preferences.
create or replace function public.create_notification(
  p_recipient_id uuid,
  p_type text,
  p_target_type text,
  p_target_id uuid,
  p_is_anonymous_actor boolean default false
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_prefs record;
  v_category text;
  v_allowed boolean;
begin
  if v_actor_id is null or v_actor_id = p_recipient_id then
    return;
  end if;

  select * into v_prefs from public.notification_preferences where user_id = p_recipient_id;

  if v_prefs.quiet_mode then
    return;
  end if;

  v_category := case
    when p_type in ('reaction_post', 'reaction_comment') then 'reactions'
    when p_type = 'comment' then 'comments'
    when p_type = 'reply' then 'replies'
    when p_type in ('follow', 'follow_request', 'follow_accepted') then 'follows'
    when p_type in ('mention_post', 'mention_comment') then 'mentions'
    else null
  end;

  v_allowed := case v_category
    when 'reactions' then coalesce(v_prefs.reactions, true)
    when 'comments' then coalesce(v_prefs.comments, true)
    when 'replies' then coalesce(v_prefs.replies, true)
    when 'follows' then coalesce(v_prefs.follows, true)
    when 'mentions' then coalesce(v_prefs.mentions, true)
    else true
  end;

  if not v_allowed then
    return;
  end if;

  insert into public.notifications (recipient_id, actor_id, is_anonymous_actor, type, target_type, target_id)
  values (p_recipient_id, v_actor_id, p_is_anonymous_actor, p_type, p_target_type, p_target_id);
end;
$$;

revoke all on function public.create_notification(uuid, text, text, uuid, boolean) from public;
grant execute on function public.create_notification(uuid, text, text, uuid, boolean) to authenticated;

alter publication supabase_realtime add table public.notifications;
