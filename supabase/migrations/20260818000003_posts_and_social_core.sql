insert into public.reserved_usernames (username) values
  ('onboarding'), ('institutions'), ('institution'), ('post'), ('posts'), ('feed')
on conflict (username) do nothing;

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  type text check (type in ('school', 'college', 'university', 'other')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  suggested_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index institutions_name_idx on public.institutions (name);
create index institutions_status_idx on public.institutions (status);

alter table public.institutions enable row level security;

create policy "approved institutions are public, own suggestions visible to suggester"
  on public.institutions for select
  using (status = 'approved' or suggested_by = auth.uid());

create policy "authenticated users can suggest an institution"
  on public.institutions for insert
  to authenticated
  with check (suggested_by = auth.uid());

create or replace function public.force_institution_pending()
returns trigger
language plpgsql
as $$
begin
  new.status := 'pending';
  return new;
end;
$$;

create trigger institutions_force_pending
  before insert on public.institutions
  for each row execute function public.force_institution_pending();

alter table public.profiles
  add column country text,
  add column education_level text check (education_level in ('school', 'plus_two', 'bachelor', 'master', 'other')),
  add column institution_id uuid references public.institutions (id) on delete set null;

create index profiles_institution_idx on public.profiles (institution_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  label text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.categories (slug, label, position) values
  ('love', 'Love', 1), ('crush', 'Crush', 2), ('breakup', 'Breakup', 3),
  ('friendship', 'Friendship', 4), ('family', 'Family', 5), ('school', 'School', 6),
  ('college', 'College', 7), ('work', 'Work', 8), ('life', 'Life', 9),
  ('pain', 'Pain', 10), ('support', 'Support', 11), ('funny', 'Funny', 12),
  ('random', 'Random', 13), ('questions', 'Questions', 14), ('drama', 'Drama', 15);

alter table public.categories enable row level security;

create policy "categories are publicly readable"
  on public.categories for select
  using (true);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('post', 'confession', 'story', 'question', 'poll', 'photo')),
  content text,
  category_id uuid references public.categories (id) on delete set null,
  mood text check (mood in ('love', 'heartbroken', 'sad', 'funny', 'angry', 'support', 'calm', 'motivated', 'confused', 'happy')),
  is_anonymous boolean not null default false,
  comments_enabled boolean not null default true,
  content_warning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_required_unless_media_type check (
    content is not null or type in ('poll', 'photo', 'post')
  )
);

create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_created_idx on public.posts (created_at desc);
create index posts_category_idx on public.posts (category_id);

alter table public.posts enable row level security;

create policy "posts are visible per author privacy"
  on public.posts for select
  using (
    auth.uid() = author_id
    or not exists (
      select 1 from public.profiles p where p.id = posts.author_id and p.is_private
    )
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid() and f.following_id = posts.author_id and f.status = 'accepted'
    )
  );

create policy "users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  url text not null,
  width int,
  height int,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index post_media_post_idx on public.post_media (post_id);

alter table public.post_media enable row level security;

create policy "post media follows post visibility"
  on public.post_media for select
  using (exists (select 1 from public.posts p where p.id = post_media.post_id));

create policy "users can attach media to their own posts"
  on public.post_media for insert
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "users can delete media on their own posts"
  on public.post_media for delete
  using (exists (select 1 from public.posts p where p.id = post_media.post_id and p.author_id = auth.uid()));

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  option_text text not null,
  position int not null default 0
);

create index poll_options_post_idx on public.poll_options (post_id);

alter table public.poll_options enable row level security;

create policy "poll options follow post visibility"
  on public.poll_options for select
  using (exists (select 1 from public.posts p where p.id = poll_options.post_id));

create policy "users can create options on their own posts"
  on public.poll_options for insert
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create table public.poll_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, voter_id)
);

alter table public.poll_votes enable row level security;

create policy "poll votes follow post visibility"
  on public.poll_votes for select
  using (exists (select 1 from public.posts p where p.id = poll_votes.post_id));

create policy "users can cast their own poll vote"
  on public.poll_votes for insert
  with check (auth.uid() = voter_id);

create policy "users can change their own poll vote"
  on public.poll_votes for delete
  using (auth.uid() = voter_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  is_anonymous boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);
create index comments_parent_idx on public.comments (parent_id);

alter table public.comments enable row level security;

create policy "comments follow post visibility"
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
  );

create policy "users can comment on posts with comments enabled"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.posts p where p.id = post_id and p.comments_enabled)
  );

create policy "users can edit their own comments"
  on public.comments for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "authors can delete their own comments or post owners can moderate"
  on public.comments for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.posts p where p.id = comments.post_id and p.author_id = auth.uid())
  );

-- Pinning is a post-owner privilege but must not let them edit someone else's
-- comment content — RLS can't restrict to a single column, so this is done
-- through a narrow security-definer function instead of a broad UPDATE policy.
create or replace function public.set_comment_pinned(p_comment_id uuid, p_pinned boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  is_owner boolean;
begin
  select exists (
    select 1 from public.comments c
    join public.posts p on p.id = c.post_id
    where c.id = p_comment_id and p.author_id = auth.uid()
  ) into is_owner;

  if not is_owner then
    raise exception 'not authorized to pin this comment';
  end if;

  update public.comments set is_pinned = p_pinned where id = p_comment_id;
end;
$$;

revoke all on function public.set_comment_pinned(uuid, boolean) from public;
grant execute on function public.set_comment_pinned(uuid, boolean) to authenticated;

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  type text not null check (type in ('love', 'hug', 'funny', 'relatable', 'angry', 'fire')),
  created_at timestamptz not null default now(),
  constraint exactly_one_target check (
    (post_id is not null and comment_id is null) or (post_id is null and comment_id is not null)
  )
);

create unique index reactions_unique_post on public.reactions (user_id, post_id) where comment_id is null;
create unique index reactions_unique_comment on public.reactions (user_id, comment_id) where post_id is null;
create index reactions_post_idx on public.reactions (post_id);
create index reactions_comment_idx on public.reactions (comment_id);

alter table public.reactions enable row level security;

create policy "reactions are publicly readable"
  on public.reactions for select
  using (true);

create policy "users can react as themselves"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "users can change their own reaction"
  on public.reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can remove their own reaction"
  on public.reactions for delete
  using (auth.uid() = user_id);

create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.bookmarks enable row level security;

create policy "users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "users can create their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

create table public.reposts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  quote text,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index reposts_post_idx on public.reposts (post_id);
create index reposts_user_idx on public.reposts (user_id, created_at desc);

alter table public.reposts enable row level security;

create policy "reposts are publicly readable"
  on public.reposts for select
  using (true);

create policy "users can repost as themselves"
  on public.reposts for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own repost"
  on public.reposts for delete
  using (auth.uid() = user_id);

create table public.hidden_posts (
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.hidden_posts enable row level security;

create policy "users can view their own hidden posts"
  on public.hidden_posts for select
  using (auth.uid() = user_id);

create policy "users can hide posts for themselves"
  on public.hidden_posts for insert
  with check (auth.uid() = user_id);

create policy "users can unhide their own hidden posts"
  on public.hidden_posts for delete
  using (auth.uid() = user_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'message', 'community')),
  target_id uuid not null,
  reason text not null check (reason in (
    'harassment', 'bullying', 'spam', 'threat', 'hate',
    'personal_information', 'impersonation', 'sexual_content', 'dangerous_content', 'other'
  )),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

create index reports_target_idx on public.reports (target_type, target_id);
create index reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

create policy "users can view their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "users can file reports as themselves"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create table public.hashtags (
  id uuid primary key default gen_random_uuid(),
  name citext not null unique,
  created_at timestamptz not null default now()
);

alter table public.hashtags enable row level security;

create policy "hashtags are publicly readable"
  on public.hashtags for select
  using (true);

create policy "authenticated users can create hashtags"
  on public.hashtags for insert
  to authenticated
  with check (true);

create table public.post_hashtags (
  post_id uuid not null references public.posts (id) on delete cascade,
  hashtag_id uuid not null references public.hashtags (id) on delete cascade,
  primary key (post_id, hashtag_id)
);

create index post_hashtags_hashtag_idx on public.post_hashtags (hashtag_id);

alter table public.post_hashtags enable row level security;

create policy "post hashtags follow post visibility"
  on public.post_hashtags for select
  using (exists (select 1 from public.posts p where p.id = post_hashtags.post_id));

create policy "users can tag their own posts"
  on public.post_hashtags for insert
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

-- Anonymized read view: identity columns are nulled for anonymous posts so the
-- real author_id is never sent to the client, not just hidden in the UI.
-- security_invoker means it still runs under the querying user's RLS.
create view public.posts_public
with (security_invoker = true) as
select
  p.id,
  p.type,
  p.content,
  p.category_id,
  p.mood,
  p.is_anonymous,
  p.comments_enabled,
  p.content_warning,
  p.created_at,
  p.updated_at,
  case when p.is_anonymous then null else p.author_id end as author_id,
  case when p.is_anonymous then null else pr.username end as author_username,
  case when p.is_anonymous then null else pr.display_name end as author_display_name,
  case when p.is_anonymous then null else pr.avatar_url end as author_avatar_url
from public.posts p
left join public.profiles pr on pr.id = p.author_id;

create view public.comments_public
with (security_invoker = true) as
select
  c.id,
  c.post_id,
  c.parent_id,
  c.content,
  c.is_anonymous,
  c.is_pinned,
  c.created_at,
  c.updated_at,
  case when c.is_anonymous then null else c.author_id end as author_id,
  case when c.is_anonymous then null else pr.username end as author_username,
  case when c.is_anonymous then null else pr.display_name end as author_display_name,
  case when c.is_anonymous then null else pr.avatar_url end as author_avatar_url
from public.comments c
left join public.profiles pr on pr.id = c.author_id;

create or replace function public.set_updated_at_generic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at_generic();

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at_generic();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "post media images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "users can upload their own post media"
  on storage.objects for insert
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own post media"
  on storage.objects for delete
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
