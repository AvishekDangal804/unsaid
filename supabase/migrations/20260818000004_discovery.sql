insert into public.reserved_usernames (username) values
  ('explore'), ('trending'), ('hashtag'), ('category'), ('community'), ('mood'), ('daily')
on conflict (username) do nothing;

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  description text,
  emoji text not null default '💬',
  created_at timestamptz not null default now()
);

insert into public.communities (slug, name, description, emoji) values
  ('love-relationships', 'Love & Relationships', 'Crushes, dating, breakups, and everything in between.', '❤️'),
  ('school-life', 'School Life', 'For students still in school.', '🎒'),
  ('college-life', 'College Life', 'College and university experiences.', '🎓'),
  ('technology', 'Technology', 'Tech talk, gadgets, and internet culture.', '💻'),
  ('music', 'Music', 'What you''re listening to and why.', '🎵'),
  ('movies-tv', 'Movies & TV', 'What you''re watching.', '🎬'),
  ('gaming', 'Gaming', 'Everything gaming.', '🎮'),
  ('funny', 'Funny', 'Made you laugh? Share it.', '😂'),
  ('support', 'Support', 'A place to be heard.', '🫂'),
  ('breakups', 'Breakups', 'Processing endings, together.', '💔');

alter table public.communities enable row level security;

create policy "communities are publicly readable"
  on public.communities for select
  using (true);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index community_members_user_idx on public.community_members (user_id);

alter table public.community_members enable row level security;

create policy "community membership is publicly readable"
  on public.community_members for select
  using (true);

create policy "users can join communities themselves"
  on public.community_members for insert
  with check (auth.uid() = user_id);

create policy "users can leave communities themselves"
  on public.community_members for delete
  using (auth.uid() = user_id);

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  created_at timestamptz not null default now()
);

insert into public.daily_questions (question_text) values
  ('What is something you wish you could tell your younger self?'),
  ('What''s a small moment that changed how you see things?'),
  ('What''s something you''re proud of that no one really knows about?'),
  ('Who is someone you''ve never properly thanked?'),
  ('What''s a fear you''ve slowly gotten over?'),
  ('What''s a lesson you learned the hard way?'),
  ('What would you do if you knew you couldn''t fail?'),
  ('What''s something you needed to hear today?'),
  ('What''s a memory that always makes you smile?'),
  ('What''s something you''re still figuring out?'),
  ('What''s the kindest thing someone has done for you?'),
  ('What''s a habit that changed your life for the better?'),
  ('What would your younger self think of who you are now?'),
  ('What''s something you''ve never told anyone?');

alter table public.daily_questions enable row level security;

create policy "daily questions are publicly readable"
  on public.daily_questions for select
  using (true);

alter table public.posts
  add column community_id uuid references public.communities (id) on delete set null,
  add column daily_question_id uuid references public.daily_questions (id) on delete set null;

create index posts_community_idx on public.posts (community_id);
create index posts_daily_question_idx on public.posts (daily_question_id);

drop policy "users can create their own posts" on public.posts;

create policy "users can create their own posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and (
      community_id is null
      or exists (
        select 1 from public.community_members cm
        where cm.community_id = posts.community_id and cm.user_id = auth.uid()
      )
    )
  );
