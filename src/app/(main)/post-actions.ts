"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCommentSchema, reportSchema } from "@/lib/validation/post";
import type { ReactionType } from "@/types/database.types";

export type ActionResult = { error: string } | { success: true };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleReaction(
  target: { postId: string } | { commentId: string },
  type: ReactionType,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const column = "postId" in target ? "post_id" : "comment_id";
  const targetId = "postId" in target ? target.postId : target.commentId;

  const { data: existing } = await supabase
    .from("reactions")
    .select("id, type")
    .eq("user_id", user.id)
    .eq(column, targetId)
    .maybeSingle();

  if (existing) {
    if (existing.type === type) {
      const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
      if (error) return { error: "Something went wrong. Try again." };
    } else {
      const { error } = await supabase.from("reactions").update({ type }).eq("id", existing.id);
      if (error) return { error: "Something went wrong. Try again." };
    }
  } else if ("postId" in target) {
    const { error } = await supabase
      .from("reactions")
      .insert({ user_id: user.id, post_id: target.postId, type });
    if (error) return { error: "Something went wrong. Try again." };
  } else {
    const { error } = await supabase
      .from("reactions")
      .insert({ user_id: user.id, comment_id: target.commentId, type });
    if (error) return { error: "Something went wrong. Try again." };
  }

  revalidatePath("/");
  return { success: true };
}

export async function toggleSave(postId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) return { error: "Something went wrong. Try again." };
  } else {
    const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, post_id: postId });
    if (error) return { error: "Something went wrong. Try again." };
  }

  revalidatePath("/saved");
  return { success: true };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath("/");
  return { success: true };
}

export async function votePoll(postId: string, optionId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  await supabase.from("poll_votes").delete().eq("post_id", postId).eq("voter_id", user.id);

  const { error } = await supabase
    .from("poll_votes")
    .insert({ post_id: postId, option_id: optionId, voter_id: user.id });

  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath("/");
  return { success: true };
}

export async function createComment(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const parsed = createCommentSchema.safeParse({
    postId: formData.get("postId"),
    parentId: formData.get("parentId") || undefined,
    content: formData.get("content"),
    isAnonymous: formData.get("isAnonymous") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your comment and try again" };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: parsed.data.postId,
    parent_id: parsed.data.parentId ?? null,
    author_id: user.id,
    content: parsed.data.content,
    is_anonymous: parsed.data.isAnonymous,
  });

  if (error) {
    return { error: "Comments are turned off for this post, or something went wrong." };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath("/");
  return { success: true };
}

export async function setCommentPinned(commentId: string, pinned: boolean): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.rpc("set_comment_pinned", {
    p_comment_id: commentId,
    p_pinned: pinned,
  });

  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath("/");
  return { success: true };
}

export async function submitReport(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the report and try again" };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });

  if (error) return { error: "Something went wrong. Try again." };
  return { success: true };
}

export async function hidePost(postId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.from("hidden_posts").insert({ user_id: user.id, post_id: postId });
  if (error) return { error: "Something went wrong. Try again." };

  revalidatePath("/");
  return { success: true };
}

export async function toggleRepost(postId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { data: existing } = await supabase
    .from("reposts")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reposts").delete().eq("id", existing.id);
    if (error) return { error: "Something went wrong. Try again." };
  } else {
    const { error } = await supabase.from("reposts").insert({ user_id: user.id, post_id: postId });
    if (error) return { error: "Something went wrong. Try again." };
  }

  revalidatePath("/");
  return { success: true };
}
