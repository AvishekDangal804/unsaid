"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function blockUser(targetId: string, targetUsername: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };
  if (user.id === targetId) return { error: "You can't block yourself" };

  const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: targetId });
  if (error && error.code !== "23505") return { error: "Something went wrong. Try again." };

  // Blocking severs any existing follow relationship in both directions.
  await supabase
    .from("follows")
    .delete()
    .or(
      `and(follower_id.eq.${user.id},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${user.id})`,
    );

  revalidatePath(`/${targetUsername}`);
  return { success: true };
}

export async function unblockUser(targetId: string, targetUsername: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);
  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath(`/${targetUsername}`);
  return { success: true };
}

export async function muteUser(targetId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };
  if (user.id === targetId) return { error: "You can't mute yourself" };

  const { error } = await supabase.from("mutes").insert({ muter_id: user.id, muted_id: targetId });
  if (error && error.code !== "23505") return { error: "Something went wrong. Try again." };

  revalidatePath("/");
  return { success: true };
}

export async function unmuteUser(targetId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.from("mutes").delete().eq("muter_id", user.id).eq("muted_id", targetId);
  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath("/");
  return { success: true };
}
