-- The blocks table's own RLS ("users can view their own block list") only
-- lets the blocker see the row — intentional, so a blocked person can't
-- tell they've been blocked. But that means any RLS policy that queries
-- blocks directly as the acting user can't see the row when *they* are the
-- blocked party, silently defeating the block for exactly the case that
-- matters. This function runs SECURITY DEFINER so it can see both
-- directions internally without exposing the row through a public-read
-- policy on blocks.
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
    or (blocker_id = b and blocked_id = a)
  );
$$;

revoke all on function public.is_blocked_pair(uuid, uuid) from public;
grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;

drop policy "posts are visible per author privacy and blocks" on public.posts;

create policy "posts are visible per author privacy and blocks v2"
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
    and not public.is_blocked_pair(auth.uid(), posts.author_id)
  );

drop policy "comments follow post visibility and blocks" on public.comments;

create policy "comments follow post visibility and blocks v2"
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
    and not public.is_blocked_pair(auth.uid(), comments.author_id)
  );

drop policy "participants can send messages, blocks permitting" on public.messages;

create policy "participants can send messages, blocks permitting v2"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_one_id = auth.uid() or c.user_two_id = auth.uid())
      and c.status <> 'declined'
      and not public.is_blocked_pair(
        auth.uid(),
        case when c.user_one_id = auth.uid() then c.user_two_id else c.user_one_id end
      )
    )
  );
