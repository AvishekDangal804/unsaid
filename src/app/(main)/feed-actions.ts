"use server";

import { getFeedPosts } from "@/lib/data/posts";
import { getCurrentUser } from "@/lib/supabase/get-user";

export async function loadFeedPage(scope: "latest" | "following", cursor?: string) {
  const user = await getCurrentUser();
  return getFeedPosts({ scope, userId: user?.id ?? null, cursor, limit: 10 });
}
