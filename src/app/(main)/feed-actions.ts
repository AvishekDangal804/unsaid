"use server";

import { getFeedPosts } from "@/lib/data/posts";
import { getCurrentUser } from "@/lib/supabase/get-user";
import type { Mood } from "@/types/database.types";

export type FeedFilter = {
  categoryId?: string;
  mood?: Mood;
  communityId?: string;
  dailyQuestionId?: string;
  hashtag?: string;
};

export async function loadFeedPage(
  scope: "latest" | "following",
  cursor?: string,
  filter?: FeedFilter,
) {
  const user = await getCurrentUser();
  return getFeedPosts({ scope, userId: user?.id ?? null, cursor, limit: 10, filter });
}
