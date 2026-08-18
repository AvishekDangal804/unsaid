import { createClient } from "@/lib/supabase/server";
import { enrichPosts } from "./posts";

export async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
  return data ?? [];
}

export async function searchPostsByText(query: string, userId: string | null) {
  const supabase = await createClient();
  const { data: rawPosts } = await supabase
    .from("posts")
    .select("*")
    .ilike("content", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!rawPosts || rawPosts.length === 0) return [];
  return enrichPosts(rawPosts, userId, supabase);
}

export async function searchHashtags(query: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("hashtags").select("id, name").ilike("name", `%${query}%`).limit(20);
  return data ?? [];
}

export async function searchCommunities(query: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("id, slug, name, description, emoji")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(20);
  return data ?? [];
}
