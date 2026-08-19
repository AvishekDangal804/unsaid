import { createClient } from "@/lib/supabase/server";

export async function getFollowList(profileId: string, direction: "followers" | "following") {
  const supabase = await createClient();

  const { data: rows } =
    direction === "followers"
      ? await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", profileId)
          .eq("status", "accepted")
          .order("created_at", { ascending: false })
      : await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", profileId)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) => ("follower_id" in r ? r.follower_id : r.following_id));
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .in("id", ids);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p) => p !== undefined);
}
