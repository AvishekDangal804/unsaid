insert into public.reserved_usernames (username) values
  ('messages'), ('message'), ('conversation'), ('conversations'),
  ('blocked'), ('muted'), ('block'), ('mute')
on conflict (username) do nothing;

alter table public.notification_preferences
  add column messages boolean not null default true;

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'follow', 'follow_request', 'follow_accepted',
  'reaction_post', 'reaction_comment',
  'comment', 'reply',
  'mention_post', 'mention_comment',
  'message',
  'system'
));

alter table public.notifications drop constraint notifications_target_type_check;
alter table public.notifications add constraint notifications_target_type_check check (
  target_type in ('post', 'comment', 'profile', 'conversation')
);

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
    when p_type = 'message' then 'messages'
    else null
  end;

  v_allowed := case v_category
    when 'reactions' then coalesce(v_prefs.reactions, true)
    when 'comments' then coalesce(v_prefs.comments, true)
    when 'replies' then coalesce(v_prefs.replies, true)
    when 'follows' then coalesce(v_prefs.follows, true)
    when 'mentions' then coalesce(v_prefs.mentions, true)
    when 'messages' then coalesce(v_prefs.messages, true)
    else true
  end;

  if not v_allowed then
    return;
  end if;

  insert into public.notifications (recipient_id, actor_id, is_anonymous_actor, type, target_type, target_id)
  values (p_recipient_id, v_actor_id, p_is_anonymous_actor, p_type, p_target_type, p_target_id);
end;
$$;

alter table public.profiles
  add column who_can_message text not null default 'everyone'
    check (who_can_message in ('everyone', 'followers', 'no_one'));

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "users can view their own block list"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "users can block others themselves"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "users can unblock themselves"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

create table public.mutes (
  muter_id uuid not null references auth.users (id) on delete cascade,
  muted_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  constraint no_self_mute check (muter_id <> muted_id)
);

alter table public.mutes enable row level security;

create policy "users can view their own mute list"
  on public.mutes for select
  using (auth.uid() = muter_id);

create policy "users can mute others themselves"
  on public.mutes for insert
  with check (auth.uid() = muter_id);

create policy "users can unmute themselves"
  on public.mutes for delete
  using (auth.uid() = muter_id);

-- Blocking hides posts/comments in both directions — extends the same
-- privacy-gated select policies from earlier migrations rather than
-- relying on the client to filter blocked authors out.
drop policy "posts are visible per author privacy" on public.posts;

create policy "posts are visible per author privacy and blocks"
  on public.posts for select
  using (
    (
      auth.uid() = author_id
      or not exists (
        select 1 from public.profiles p where p.id = posts.author_id and p.is_private
      )
      or exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = posts.author_id and f.status = 'accepted'
      )
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = posts.author_id)
      or (b.blocker_id = posts.author_id and b.blocked_id = auth.uid())
    )
  );

drop policy "comments follow post visibility" on public.comments;

create policy "comments follow post visibility and blocks"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = comments.post_id
      and (
        auth.uid() = p.author_id
        or not exists (select 1 from public.profiles pr where pr.id = p.author_id and pr.is_private)
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = p.author_id and f.status = 'accepted'
        )
      )
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = comments.author_id)
      or (b.blocker_id = comments.author_id and b.blocked_id = auth.uid())
    )
  );

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_one_id uuid not null references auth.users (id) on delete cascade,
  user_two_id uuid not null references auth.users (id) on delete cascade,
  initiator_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint ordered_participants check (user_one_id < user_two_id)
);

create unique index conversations_pair_idx on public.conversations (user_one_id, user_two_id);
create index conversations_user_one_idx on public.conversations (user_one_id, last_message_at desc);
create index conversations_user_two_idx on public.conversations (user_two_id, last_message_at desc);

alter table public.conversations enable row level security;

create policy "participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = user_one_id or auth.uid() = user_two_id);

create policy "participants can update their conversation status"
  on public.conversations for update
  using (auth.uid() = user_one_id or auth.uid() = user_two_id)
  with check (auth.uid() = user_one_id or auth.uid() = user_two_id);

create table public.conversation_deletions (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  deleted_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_deletions enable row level security;

create policy "users can view their own conversation deletions"
  on public.conversation_deletions for select
  using (auth.uid() = user_id);

create policy "users can hide their own conversations"
  on public.conversation_deletions for insert
  with check (auth.uid() = user_id);

create policy "users can unhide their own conversations"
  on public.conversation_deletions for delete
  using (auth.uid() = user_id);

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_reads enable row level security;

create policy "participants can view their own read state"
  on public.conversation_reads for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_reads.conversation_id
      and (c.user_one_id = auth.uid() or c.user_two_id = auth.uid())
    )
  );

create policy "participants can upsert their own read state"
  on public.conversation_reads for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_one_id = auth.uid() or c.user_two_id = auth.uid())
    )
  );

create policy "participants can update their own read state"
  on public.conversation_reads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "participants can view their messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and (c.user_one_id = auth.uid() or c.user_two_id = auth.uid())
    )
  );

create policy "participants can send messages, blocks permitting"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_one_id = auth.uid() or c.user_two_id = auth.uid())
      and c.status <> 'declined'
      and not exists (
        select 1 from public.blocks b
        where (
          b.blocker_id = auth.uid()
          and b.blocked_id = case when c.user_one_id = auth.uid() then c.user_two_id else c.user_one_id end
        )
        or (
          b.blocked_id = auth.uid()
          and b.blocker_id = case when c.user_one_id = auth.uid() then c.user_two_id else c.user_one_id end
        )
      )
    )
  );

create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_last_message();

-- Conversations are only ever created through this function, never a
-- direct client INSERT (no insert policy exists on the table) — it
-- normalizes participant ordering, enforces the recipient's messaging
-- privacy setting and block list server-side, and decides request vs.
-- instant-accept status, none of which a client should be trusted to set.
create or replace function public.get_or_create_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_one uuid;
  v_two uuid;
  v_existing_id uuid;
  v_who_can_message text;
  v_is_mutual boolean;
  v_status text;
begin
  if v_me is null or v_me = p_other_user_id then
    raise exception 'invalid conversation participants';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_me and b.blocked_id = p_other_user_id)
    or (b.blocker_id = p_other_user_id and b.blocked_id = v_me)
  ) then
    raise exception 'messaging is not available between these users';
  end if;

  v_one := least(v_me, p_other_user_id);
  v_two := greatest(v_me, p_other_user_id);

  select id into v_existing_id from public.conversations where user_one_id = v_one and user_two_id = v_two;
  if v_existing_id is not null then
    return v_existing_id;
  end if;

  select who_can_message into v_who_can_message from public.profiles where id = p_other_user_id;

  select exists (
    select 1 from public.follows f
    where f.status = 'accepted'
    and (
      (f.follower_id = v_me and f.following_id = p_other_user_id)
      or (f.follower_id = p_other_user_id and f.following_id = v_me)
    )
  ) into v_is_mutual;

  if v_who_can_message = 'no_one' then
    raise exception 'this person is not accepting messages';
  end if;

  if v_who_can_message = 'followers' and not exists (
    select 1 from public.follows f
    where f.follower_id = p_other_user_id and f.following_id = v_me and f.status = 'accepted'
  ) then
    raise exception 'this person only accepts messages from people they follow';
  end if;

  v_status := case when v_is_mutual then 'accepted' else 'pending' end;

  insert into public.conversations (user_one_id, user_two_id, initiator_id, status)
  values (v_one, v_two, v_me, v_status)
  returning id into v_existing_id;

  return v_existing_id;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid) from public;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;

alter publication supabase_realtime add table public.messages;
