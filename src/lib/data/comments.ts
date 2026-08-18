import { createClient } from "@/lib/supabase/server";
import type { ReactionType } from "@/types/database.types";

export type FeedComment = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isAnonymous: boolean;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  reactionCounts: Partial<Record<ReactionType, number>>;
  myReaction: ReactionType | null;
  // Computed server-side against the real author_id — author?.id is null for
  // anonymous comments, so this must not be derived from it on the client.
  isOwnComment: boolean;
};

export async function getCommentsForPost(postId: string, userId: string | null): Promise<FeedComment[]> {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: true });

  if (!comments || comments.length === 0) return [];

  const commentIds = comments.map((c) => c.id);
  const nonAnonAuthorIds = Array.from(
    new Set(comments.filter((c) => !c.is_anonymous).map((c) => c.author_id)),
  );

  const [profilesResult, reactionsResult, myReactionsResult] = await Promise.all([
    nonAnonAuthorIds.length > 0
      ? supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", nonAnonAuthorIds)
      : Promise.resolve({ data: [] }),
    supabase.from("reactions").select("comment_id, type").in("comment_id", commentIds),
    userId
      ? supabase.from("reactions").select("comment_id, type").eq("user_id", userId).in("comment_id", commentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));

  const reactionCountsByComment = new Map<string, Partial<Record<ReactionType, number>>>();
  for (const r of reactionsResult.data ?? []) {
    if (!r.comment_id) continue;
    const counts = reactionCountsByComment.get(r.comment_id) ?? {};
    counts[r.type as ReactionType] = (counts[r.type as ReactionType] ?? 0) + 1;
    reactionCountsByComment.set(r.comment_id, counts);
  }

  const myReactionByComment = new Map<string, ReactionType>();
  for (const r of myReactionsResult.data ?? []) {
    if (r.comment_id) myReactionByComment.set(r.comment_id, r.type as ReactionType);
  }

  return comments.map((c) => {
    const profile = c.is_anonymous ? null : profileMap.get(c.author_id);
    return {
      id: c.id,
      postId: c.post_id,
      parentId: c.parent_id,
      content: c.content,
      isAnonymous: c.is_anonymous,
      isPinned: c.is_pinned,
      createdAt: c.created_at,
      author: profile
        ? {
            id: c.author_id,
            username: profile.username,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
          }
        : null,
      reactionCounts: reactionCountsByComment.get(c.id) ?? {},
      myReaction: myReactionByComment.get(c.id) ?? null,
      isOwnComment: userId === c.author_id,
    };
  });
}
