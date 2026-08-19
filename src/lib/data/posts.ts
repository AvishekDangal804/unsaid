import { createClient } from "@/lib/supabase/server";
import type { Post, PostType, Mood, ReactionType } from "@/types/database.types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type FeedPost = {
  id: string;
  type: PostType;
  content: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  mood: Mood | null;
  isAnonymous: boolean;
  commentsEnabled: boolean;
  contentWarning: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  media: { url: string; width: number | null; height: number | null; type: "image" | "video" }[];
  pollOptions: { id: string; text: string; votes: number }[];
  myPollVote: string | null;
  totalPollVotes: number;
  reactionCounts: Partial<Record<ReactionType, number>>;
  myReaction: ReactionType | null;
  commentCount: number;
  isSaved: boolean;
  repostCount: number;
  isReposted: boolean;
  // Computed server-side against the real author_id — author?.id is null for
  // anonymous posts, so this must not be derived from it on the client.
  isOwnPost: boolean;
};

// Masks author identity for anonymous posts in application code rather than
// relying solely on the posts_public view — needed because the "Following"
// feed must filter by the *real* author_id server-side, which the view
// deliberately nulls out for anonymous rows.
function maskAuthor(
  post: Post,
  profiles: Map<string, { username: string; display_name: string | null; avatar_url: string | null }>,
): FeedPost["author"] {
  if (post.is_anonymous) return null;
  const profile = profiles.get(post.author_id);
  if (!profile) return null;
  return {
    id: post.author_id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
  };
}

export async function enrichPosts(
  page: Post[],
  userId: string | null,
  supabase: SupabaseServerClient,
): Promise<FeedPost[]> {
  if (page.length === 0) return [];

  const postIds = page.map((p) => p.id);
  const nonAnonAuthorIds = Array.from(
    new Set(page.filter((p) => !p.is_anonymous).map((p) => p.author_id)),
  );
  const categoryIds = Array.from(new Set(page.map((p) => p.category_id).filter(Boolean))) as string[];
  const pollPostIds = page.filter((p) => p.type === "poll").map((p) => p.id);
  const mediaPostIds = page.filter((p) => p.type === "photo" || p.type === "post").map((p) => p.id);

  const [
    profilesResult,
    categoriesResult,
    mediaResult,
    pollOptionsResult,
    pollVotesResult,
    myVotesResult,
    reactionsResult,
    myReactionsResult,
    commentsResult,
    savesResult,
    repostsResult,
    myRepostsResult,
  ] = await Promise.all([
    nonAnonAuthorIds.length > 0
      ? supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", nonAnonAuthorIds)
      : Promise.resolve({ data: [] }),
    categoryIds.length > 0
      ? supabase.from("categories").select("id, label").in("id", categoryIds)
      : Promise.resolve({ data: [] }),
    mediaPostIds.length > 0
      ? supabase
          .from("post_media")
          .select("post_id, url, width, height, position, media_type")
          .in("post_id", mediaPostIds)
          .order("position")
      : Promise.resolve({ data: [] }),
    pollPostIds.length > 0
      ? supabase
          .from("poll_options")
          .select("id, post_id, option_text, position")
          .in("post_id", pollPostIds)
          .order("position")
      : Promise.resolve({ data: [] }),
    pollPostIds.length > 0
      ? supabase.from("poll_votes").select("post_id, option_id").in("post_id", pollPostIds)
      : Promise.resolve({ data: [] }),
    userId && pollPostIds.length > 0
      ? supabase.from("poll_votes").select("post_id, option_id").eq("voter_id", userId).in("post_id", pollPostIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("reactions").select("post_id, type").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    userId && postIds.length > 0
      ? supabase.from("reactions").select("post_id, type").eq("user_id", userId).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("comments").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    userId && postIds.length > 0
      ? supabase.from("bookmarks").select("post_id").eq("user_id", userId).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("reposts").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    userId && postIds.length > 0
      ? supabase.from("reposts").select("post_id").eq("user_id", userId).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));
  const categoryMap = new Map((categoriesResult.data ?? []).map((c) => [c.id, c.label]));

  const mediaByPost = new Map<string, FeedPost["media"]>();
  for (const m of mediaResult.data ?? []) {
    const list = mediaByPost.get(m.post_id) ?? [];
    list.push({ url: m.url, width: m.width, height: m.height, type: m.media_type });
    mediaByPost.set(m.post_id, list);
  }

  const optionsByPost = new Map<string, { id: string; text: string }[]>();
  for (const o of pollOptionsResult.data ?? []) {
    const list = optionsByPost.get(o.post_id) ?? [];
    list.push({ id: o.id, text: o.option_text });
    optionsByPost.set(o.post_id, list);
  }

  const voteCountByOption = new Map<string, number>();
  for (const v of pollVotesResult.data ?? []) {
    voteCountByOption.set(v.option_id, (voteCountByOption.get(v.option_id) ?? 0) + 1);
  }

  const myVoteByPost = new Map<string, string>();
  for (const v of myVotesResult.data ?? []) {
    myVoteByPost.set(v.post_id, v.option_id);
  }

  const reactionCountsByPost = new Map<string, Partial<Record<ReactionType, number>>>();
  for (const r of reactionsResult.data ?? []) {
    if (!r.post_id) continue;
    const counts = reactionCountsByPost.get(r.post_id) ?? {};
    counts[r.type as ReactionType] = (counts[r.type as ReactionType] ?? 0) + 1;
    reactionCountsByPost.set(r.post_id, counts);
  }

  const myReactionByPost = new Map<string, ReactionType>();
  for (const r of myReactionsResult.data ?? []) {
    if (r.post_id) myReactionByPost.set(r.post_id, r.type as ReactionType);
  }

  const commentCountByPost = new Map<string, number>();
  for (const c of commentsResult.data ?? []) {
    commentCountByPost.set(c.post_id, (commentCountByPost.get(c.post_id) ?? 0) + 1);
  }

  const savedPostIds = new Set((savesResult.data ?? []).map((s) => s.post_id));

  const repostCountByPost = new Map<string, number>();
  for (const r of repostsResult.data ?? []) {
    repostCountByPost.set(r.post_id, (repostCountByPost.get(r.post_id) ?? 0) + 1);
  }
  const myRepostedIds = new Set((myRepostsResult.data ?? []).map((r) => r.post_id));

  return page.map((post) => {
    const options = optionsByPost.get(post.id) ?? [];
    const pollOptions = options.map((o) => ({
      id: o.id,
      text: o.text,
      votes: voteCountByOption.get(o.id) ?? 0,
    }));
    const totalPollVotes = pollOptions.reduce((sum, o) => sum + o.votes, 0);

    return {
      id: post.id,
      type: post.type,
      content: post.content,
      categoryId: post.category_id,
      categoryLabel: post.category_id ? categoryMap.get(post.category_id) ?? null : null,
      mood: post.mood,
      isAnonymous: post.is_anonymous,
      commentsEnabled: post.comments_enabled,
      contentWarning: post.content_warning,
      createdAt: post.created_at,
      author: maskAuthor(post, profileMap),
      media: mediaByPost.get(post.id) ?? [],
      pollOptions,
      myPollVote: myVoteByPost.get(post.id) ?? null,
      totalPollVotes,
      reactionCounts: reactionCountsByPost.get(post.id) ?? {},
      myReaction: myReactionByPost.get(post.id) ?? null,
      commentCount: commentCountByPost.get(post.id) ?? 0,
      isSaved: savedPostIds.has(post.id),
      repostCount: repostCountByPost.get(post.id) ?? 0,
      isReposted: myRepostedIds.has(post.id),
      isOwnPost: userId === post.author_id,
    };
  });
}

export async function getFeedPosts(options: {
  scope: "latest" | "following";
  userId: string | null;
  cursor?: string;
  limit?: number;
  filter?: {
    categoryId?: string;
    mood?: Mood;
    communityId?: string;
    dailyQuestionId?: string;
    hashtag?: string;
  };
}): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const { scope, userId, cursor, limit = 10, filter } = options;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  if (scope === "following") {
    if (!userId) return { posts: [], nextCursor: null };
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .eq("status", "accepted");
    const authorIds = [userId, ...(following ?? []).map((f) => f.following_id)];
    query = query.in("author_id", authorIds);
  }

  if (userId) {
    const { data: hidden } = await supabase.from("hidden_posts").select("post_id").eq("user_id", userId);
    const hiddenIds = (hidden ?? []).map((h) => h.post_id);
    if (hiddenIds.length > 0) {
      query = query.not("id", "in", `(${hiddenIds.join(",")})`);
    }

    const { data: muted } = await supabase.from("mutes").select("muted_id").eq("muter_id", userId);
    const mutedIds = (muted ?? []).map((m) => m.muted_id);
    if (mutedIds.length > 0) {
      query = query.not("author_id", "in", `(${mutedIds.join(",")})`);
    }
  }

  if (filter?.categoryId) query = query.eq("category_id", filter.categoryId);
  if (filter?.mood) query = query.eq("mood", filter.mood);
  if (filter?.communityId) query = query.eq("community_id", filter.communityId);
  if (filter?.dailyQuestionId) query = query.eq("daily_question_id", filter.dailyQuestionId);

  if (filter?.hashtag) {
    const { data: hashtagRow } = await supabase
      .from("hashtags")
      .select("id")
      .ilike("name", filter.hashtag)
      .maybeSingle();
    if (!hashtagRow) return { posts: [], nextCursor: null };
    const { data: tagged } = await supabase
      .from("post_hashtags")
      .select("post_id")
      .eq("hashtag_id", hashtagRow.id);
    const taggedIds = (tagged ?? []).map((t) => t.post_id);
    if (taggedIds.length === 0) return { posts: [], nextCursor: null };
    query = query.in("id", taggedIds);
  }

  const { data: rawPosts } = await query;
  if (!rawPosts || rawPosts.length === 0) return { posts: [], nextCursor: null };

  const hasMore = rawPosts.length > limit;
  const page = hasMore ? rawPosts.slice(0, limit) : rawPosts;
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  const posts = await enrichPosts(page, userId, supabase);
  return { posts, nextCursor };
}

// Recency-weighted engagement, capped at 2 posts per author so one viral
// post (or one prolific author) can't dominate the whole list.
export async function getTrendingPosts(userId: string | null, limit = 20): Promise<FeedPost[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rawPosts } = await supabase
    .from("posts")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!rawPosts || rawPosts.length === 0) return [];

  const enriched = await enrichPosts(rawPosts, userId, supabase);

  const scored = enriched
    .map((post) => {
      const reactionTotal = Object.values(post.reactionCounts).reduce((sum, n) => sum + (n ?? 0), 0);
      const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;
      const score = (reactionTotal + post.commentCount * 2 + post.repostCount * 1.5) / Math.pow(ageHours + 2, 1.3);
      return { post, score };
    })
    .sort((a, b) => b.score - a.score);

  const perAuthorCount = new Map<string, number>();
  const result: FeedPost[] = [];

  for (const { post } of scored) {
    const authorKey = post.author?.id ?? post.id;
    const count = perAuthorCount.get(authorKey) ?? 0;
    if (count >= 2) continue;
    perAuthorCount.set(authorKey, count + 1);
    result.push(post);
    if (result.length >= limit) break;
  }

  return result;
}

export async function getTrendingHashtags(limit = 10): Promise<{ name: string; count: number }[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentPosts } = await supabase.from("posts").select("id").gte("created_at", since);
  if (!recentPosts || recentPosts.length === 0) return [];

  const { data: tags } = await supabase
    .from("post_hashtags")
    .select("hashtag_id")
    .in("post_id", recentPosts.map((p) => p.id));
  if (!tags || tags.length === 0) return [];

  const countByHashtag = new Map<string, number>();
  for (const t of tags) {
    countByHashtag.set(t.hashtag_id, (countByHashtag.get(t.hashtag_id) ?? 0) + 1);
  }

  const topIds = Array.from(countByHashtag.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const { data: hashtagRows } = await supabase.from("hashtags").select("id, name").in("id", topIds);

  return topIds
    .map((id) => {
      const row = hashtagRows?.find((h) => h.id === id);
      return row ? { name: row.name, count: countByHashtag.get(id) ?? 0 } : null;
    })
    .filter((x): x is { name: string; count: number } => x !== null);
}

export async function getSinglePost(postId: string, userId: string | null): Promise<FeedPost | null> {
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", postId).maybeSingle();
  if (!post) return null;

  const posts = await enrichPosts([post], userId, supabase);
  return posts[0] ?? null;
}

export async function getSavedPosts(userId: string): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!bookmarks || bookmarks.length === 0) return [];

  const postIds = bookmarks.map((b) => b.post_id);
  const { data: page } = await supabase.from("posts").select("*").in("id", postIds);
  if (!page) return [];

  const orderIndex = new Map(postIds.map((id, i) => [id, i]));
  const ordered = [...page].sort(
    (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
  );

  return enrichPosts(ordered, userId, supabase);
}

// Used for the public /[username] profile page. Anonymous posts are excluded
// even for the author's own view of their own profile — a post appearing on
// this page at all identifies its author, regardless of how it's labeled, so
// "Anonymous" here would only be anonymous in name.
export async function getPostsByAuthor(authorId: string, userId: string | null): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", authorId)
    .eq("is_anonymous", false)
    .order("created_at", { ascending: false });

  if (!page) return [];
  return enrichPosts(page, userId, supabase);
}
