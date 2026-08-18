insert into public.reserved_usernames (username) values
  ('admin'), ('moderation'), ('moderator'), ('suspended'), ('banned')
on conflict (username) do nothing;

create table public.admin_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;

create policy "users can check their own admin role"
  on public.admin_roles for select
  using (auth.uid() = user_id);

create or replace function public.is_staff(p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.admin_roles where user_id = p_user_id);
$$;

revoke all on function public.is_staff(uuid) from public;
grant execute on function public.is_staff(uuid) to authenticated;

alter table public.profiles
  add column status text not null default 'active' check (status in ('active', 'suspended', 'banned')),
  add column suspended_until timestamptz,
  add column is_restricted boolean not null default false;

-- The existing "users can update own profile" policy (from Phase 1) allows
-- updating any column of your own row, which would otherwise let a user
-- un-ban or un-restrict themselves via a raw client update. RLS can't
-- restrict to specific columns, so this is enforced with column-level
-- privileges instead — only the moderate() function (SECURITY DEFINER,
-- runs as table owner) can touch these columns going forward.
revoke update (status, suspended_until, is_restricted) on public.profiles from authenticated;

create or replace function public.clear_expired_suspension(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set status = 'active', suspended_until = null
  where id = p_user_id and status = 'suspended' and suspended_until < now();
end;
$$;

revoke all on function public.clear_expired_suspension(uuid) from public;
grant execute on function public.clear_expired_suspension(uuid) to authenticated;

alter table public.posts add column is_hidden boolean not null default false;
alter table public.comments add column is_hidden boolean not null default false;

drop policy "posts are visible per author privacy and blocks v2" on public.posts;

create policy "posts are visible per author privacy blocks and moderation"
  on public.posts for select
  using (
    (not is_hidden or auth.uid() = author_id or public.is_staff(auth.uid()))
    and (
      auth.uid() = author_id
      or not exists (
        select 1 from public.profiles p where p.id = posts.author_id and p.is_private
      )
      or exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = posts.author_id and f.status = 'accepted'
      )
    )
    and not public.is_blocked_pair(auth.uid(), posts.author_id)
  );

drop policy "comments follow post visibility and blocks v2" on public.comments;

create policy "comments follow post visibility blocks and moderation"
  on public.comments for select
  using (
    (not is_hidden or auth.uid() = author_id or public.is_staff(auth.uid()))
    and exists (
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
    and not public.is_blocked_pair(auth.uid(), comments.author_id)
  );

drop policy "users can create their own posts" on public.posts;

create policy "users can create their own posts if not restricted"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and (p.is_restricted or p.status <> 'active'))
    and (
      community_id is null
      or exists (
        select 1 from public.community_members cm
        where cm.community_id = posts.community_id and cm.user_id = auth.uid()
      )
    )
  );

drop policy "users can comment on posts with comments enabled" on public.comments;

create policy "users can comment if not restricted"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and (p.is_restricted or p.status <> 'active'))
    and exists (select 1 from public.posts p where p.id = post_id and p.comments_enabled)
  );

alter table public.notifications add column message text;

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users (id) on delete set null,
  report_id uuid references public.reports (id) on delete set null,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'message', 'community')),
  target_id uuid not null,
  action text not null check (action in ('dismiss', 'remove_content', 'hide_content', 'warn', 'suspend', 'ban', 'restrict', 'unrestrict', 'unsuspend', 'unban')),
  reason text,
  created_at timestamptz not null default now()
);

create index moderation_actions_target_idx on public.moderation_actions (target_type, target_id);
create index moderation_actions_created_idx on public.moderation_actions (created_at desc);

alter table public.moderation_actions enable row level security;

create policy "staff can view moderation actions"
  on public.moderation_actions for select
  using (public.is_staff(auth.uid()));

-- All moderation is performed through this function so it's atomic
-- (action + report status + audit log entry together) and so
-- authorization is checked once, server-side, rather than trusted from
-- the client — never gated by a frontend route or an email check.
create or replace function public.moderate(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_report_id uuid default null,
  p_reason text default null,
  p_duration_hours int default 24
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'not authorized';
  end if;

  if p_action = 'remove_content' and p_target_type = 'post' then
    delete from public.posts where id = p_target_id;
  elsif p_action = 'remove_content' and p_target_type = 'comment' then
    delete from public.comments where id = p_target_id;
  elsif p_action = 'hide_content' and p_target_type = 'post' then
    update public.posts set is_hidden = true where id = p_target_id;
  elsif p_action = 'hide_content' and p_target_type = 'comment' then
    update public.comments set is_hidden = true where id = p_target_id;
  elsif p_action = 'warn' and p_target_type = 'user' then
    insert into public.notifications (recipient_id, actor_id, type, message)
    values (p_target_id, null, 'system', coalesce(p_reason, 'You received a warning from our moderation team.'));
  elsif p_action = 'suspend' and p_target_type = 'user' then
    update public.profiles
    set status = 'suspended', suspended_until = now() + make_interval(hours => coalesce(p_duration_hours, 24))
    where id = p_target_id;
    insert into public.notifications (recipient_id, actor_id, type, message)
    values (p_target_id, null, 'system', coalesce(p_reason, 'Your account has been temporarily suspended.'));
  elsif p_action = 'ban' and p_target_type = 'user' then
    update public.profiles set status = 'banned' where id = p_target_id;
    insert into public.notifications (recipient_id, actor_id, type, message)
    values (p_target_id, null, 'system', coalesce(p_reason, 'Your account has been banned.'));
  elsif p_action = 'restrict' and p_target_type = 'user' then
    update public.profiles set is_restricted = true where id = p_target_id;
    insert into public.notifications (recipient_id, actor_id, type, message)
    values (p_target_id, null, 'system', coalesce(p_reason, 'Posting has been restricted on your account.'));
  elsif p_action = 'unrestrict' and p_target_type = 'user' then
    update public.profiles set is_restricted = false where id = p_target_id;
  elsif p_action = 'unsuspend' and p_target_type = 'user' then
    update public.profiles set status = 'active', suspended_until = null where id = p_target_id;
  elsif p_action = 'unban' and p_target_type = 'user' then
    update public.profiles set status = 'active' where id = p_target_id;
  elsif p_action = 'dismiss' then
    null;
  else
    raise exception 'unsupported moderation action';
  end if;

  if p_report_id is not null then
    update public.reports
    set status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end
    where id = p_report_id;
  end if;

  insert into public.moderation_actions (moderator_id, report_id, target_type, target_id, action, reason)
  values (auth.uid(), p_report_id, p_target_type, p_target_id, p_action, p_reason);
end;
$$;

revoke all on function public.moderate(text, text, uuid, uuid, text, int) from public;
grant execute on function public.moderate(text, text, uuid, uuid, text, int) to authenticated;

-- Staff need to see all reports, not just their own — reports select
-- policy was owner-only until now.
create policy "staff can view all reports"
  on public.reports for select
  using (public.is_staff(auth.uid()));
