alter table public.notifications drop constraint notifications_target_type_check;
alter table public.notifications add constraint notifications_target_type_check check (
  target_type in ('post', 'comment', 'profile', 'conversation', 'group_conversation')
);

create table public.group_conversations (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.group_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.group_conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index group_messages_group_idx on public.group_messages (group_id, created_at);

alter table public.group_conversations enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;

create policy "members can view their groups"
  on public.group_conversations for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_conversations.id and gm.user_id = auth.uid()
    )
  );

-- Membership rows are only ever written through create_group_conversation /
-- add_group_member (both security definer, below) — no insert policy exists
-- on this table, matching the same pattern used for 1:1 conversations.
create policy "members can view their group's member list"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()
    )
  );

create policy "members can leave a group themselves"
  on public.group_members for delete
  using (auth.uid() = user_id);

create policy "members can view messages in their groups, blocks permitting"
  on public.group_messages for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_messages.group_id and gm.user_id = auth.uid()
    )
    and not public.is_blocked_pair(auth.uid(), sender_id)
  );

create policy "members can send messages to their groups"
  on public.group_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid()
    )
    and not exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_messages.group_id
      and gm2.user_id <> auth.uid()
      and public.is_blocked_pair(auth.uid(), gm2.user_id)
    )
  );

create or replace function public.touch_group_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.group_conversations set last_message_at = new.created_at where id = new.group_id;
  return new;
end;
$$;

create trigger group_messages_touch_conversation
  after insert on public.group_messages
  for each row execute function public.touch_group_conversation_last_message();

-- Groups can only be created and grown through these two functions (no
-- insert policy exists on group_conversations or group_members) — they
-- enforce group size limits and require the adder and the person being
-- added to mutually follow each other and not be blocked, server-side.
create or replace function public.create_group_conversation(p_name text, p_member_ids uuid[])
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_group_id uuid;
  v_member_id uuid;
  v_is_mutual boolean;
begin
  if v_me is null then
    raise exception 'not authenticated';
  end if;

  if p_member_ids is null or array_length(p_member_ids, 1) is null then
    raise exception 'a group needs at least one other member';
  end if;

  if array_length(p_member_ids, 1) > 49 then
    raise exception 'groups are limited to 50 members';
  end if;

  foreach v_member_id in array p_member_ids loop
    if v_member_id = v_me then
      continue;
    end if;

    if public.is_blocked_pair(v_me, v_member_id) then
      raise exception 'one of the people you picked can''t be added';
    end if;

    select exists (
      select 1 from public.follows f
      where f.status = 'accepted'
      and (
        (f.follower_id = v_me and f.following_id = v_member_id)
        or (f.follower_id = v_member_id and f.following_id = v_me)
      )
    ) into v_is_mutual;

    if not v_is_mutual then
      raise exception 'you can only add people you follow each other with';
    end if;
  end loop;

  insert into public.group_conversations (name, created_by) values (nullif(trim(p_name), ''), v_me)
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id, role) values (v_group_id, v_me, 'owner');

  insert into public.group_members (group_id, user_id, role)
  select v_group_id, m, 'member' from unnest(p_member_ids) as m where m <> v_me;

  return v_group_id;
end;
$$;

create or replace function public.add_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_is_owner boolean;
  v_is_mutual boolean;
begin
  if v_me is null then
    raise exception 'not authenticated';
  end if;

  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = v_me and gm.role = 'owner'
  ) into v_is_owner;

  if not v_is_owner then
    raise exception 'only the group creator can add members';
  end if;

  if (select count(*) from public.group_members where group_id = p_group_id) >= 50 then
    raise exception 'groups are limited to 50 members';
  end if;

  if public.is_blocked_pair(v_me, p_user_id) then
    raise exception 'this person can''t be added';
  end if;

  select exists (
    select 1 from public.follows f
    where f.status = 'accepted'
    and (
      (f.follower_id = v_me and f.following_id = p_user_id)
      or (f.follower_id = p_user_id and f.following_id = v_me)
    )
  ) into v_is_mutual;

  if not v_is_mutual then
    raise exception 'you can only add people you follow each other with';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (p_group_id, p_user_id, 'member')
  on conflict (group_id, user_id) do nothing;
end;
$$;

revoke all on function public.create_group_conversation(text, uuid[]) from public;
grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;
revoke all on function public.add_group_member(uuid, uuid) from public;
grant execute on function public.add_group_member(uuid, uuid) to authenticated;

alter publication supabase_realtime add table public.group_messages;
