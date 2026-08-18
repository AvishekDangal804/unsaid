"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

export async function joinCommunity(communityId: string, slug: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: user.id });

  if (error && error.code !== "23505") {
    return { error: "Something went wrong. Try again." };
  }

  revalidatePath(`/community/${slug}`);
  return { success: true };
}

export async function leaveCommunity(communityId: string, slug: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath(`/community/${slug}`);
  return { success: true };
}
