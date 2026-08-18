"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPostSchema } from "@/lib/validation/post";
import { extractHashtags } from "@/lib/hashtags";

export type ActionResult = { error: string } | { success: true; postId: string };

export async function createPost(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  const pollOptionsRaw = formData.getAll("pollOptions").map(String).filter(Boolean);
  const mediaUrlsRaw = formData.getAll("mediaUrls").map(String).filter(Boolean);

  const parsed = createPostSchema.safeParse({
    type: formData.get("type"),
    content: formData.get("content") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    mood: formData.get("mood") || undefined,
    isAnonymous: formData.get("isAnonymous") === "on",
    commentsEnabled: formData.get("commentsEnabled") !== "off",
    contentWarning: formData.get("contentWarning") || undefined,
    pollOptions: pollOptionsRaw.length > 0 ? pollOptionsRaw : undefined,
    mediaUrls: mediaUrlsRaw.length > 0 ? mediaUrlsRaw : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your post and try again" };
  }

  const data = parsed.data;
  const communityId = (formData.get("communityId") as string) || null;
  const dailyQuestionId = (formData.get("dailyQuestionId") as string) || null;

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      type: data.type,
      content: data.content || null,
      category_id: data.categoryId || null,
      mood: data.mood || null,
      is_anonymous: data.isAnonymous,
      comments_enabled: data.commentsEnabled,
      content_warning: data.contentWarning || null,
      community_id: communityId,
      daily_question_id: dailyQuestionId,
    })
    .select("id")
    .single();

  if (error || !post) {
    return {
      error: communityId
        ? "Couldn't post there — you may need to join the community first."
        : "Something went wrong posting that. Try again.",
    };
  }

  if (data.type === "poll" && data.pollOptions) {
    const { error: optionsError } = await supabase.from("poll_options").insert(
      data.pollOptions.map((option_text, position) => ({
        post_id: post.id,
        option_text,
        position,
      })),
    );
    if (optionsError) {
      await supabase.from("posts").delete().eq("id", post.id);
      return { error: "Something went wrong with your poll options. Try again." };
    }
  }

  if ((data.type === "photo" || data.type === "post") && data.mediaUrls && data.mediaUrls.length > 0) {
    const { error: mediaError } = await supabase.from("post_media").insert(
      data.mediaUrls.map((url, position) => ({ post_id: post.id, url, position })),
    );
    if (mediaError) {
      await supabase.from("posts").delete().eq("id", post.id);
      return { error: "Something went wrong attaching your photo. Try again." };
    }
  }

  const tags = extractHashtags(data.content);
  if (tags.length > 0) {
    for (const tag of tags) {
      const { data: hashtag } = await supabase
        .from("hashtags")
        .upsert({ name: tag }, { onConflict: "name" })
        .select("id")
        .single();
      if (hashtag) {
        await supabase.from("post_hashtags").insert({ post_id: post.id, hashtag_id: hashtag.id });
      }
    }
  }

  revalidatePath("/");
  return { success: true, postId: post.id };
}

export async function createPostAndRedirect(formData: FormData) {
  const result = await createPost(formData);
  if ("success" in result) {
    redirect("/");
  }
  return result;
}
