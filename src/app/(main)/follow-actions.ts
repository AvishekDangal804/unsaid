"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

export async function followUser(targetId: string, targetUsername: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  if (user.id === targetId) {
    return { error: "You can't follow yourself" };
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetId });

  if (error) {
    if (error.code === "23505") {
      return { success: true };
    }
    return { error: "Something went wrong. Try again." };
  }

  revalidatePath(`/${targetUsername}`);
  return { success: true };
}

export async function unfollowUser(targetId: string, targetUsername: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);

  if (error) {
    return { error: "Something went wrong. Try again." };
  }

  revalidatePath(`/${targetUsername}`);
  return { success: true };
}

export async function acceptFollowRequest(followerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  const { error } = await supabase
    .from("follows")
    .update({ status: "accepted" })
    .eq("follower_id", followerId)
    .eq("following_id", user.id);

  if (error) {
    return { error: "Something went wrong. Try again." };
  }

  revalidatePath("/requests");
  return { success: true };
}

export async function declineFollowRequest(followerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", user.id);

  if (error) {
    return { error: "Something went wrong. Try again." };
  }

  revalidatePath("/requests");
  return { success: true };
}
