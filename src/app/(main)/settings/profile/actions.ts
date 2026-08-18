"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProfileSchema } from "@/lib/validation/profile";

export type ActionResult = { error: string } | { success: true; username: string };

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  const parsed = updateProfileSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName") || undefined,
    bio: formData.get("bio") || undefined,
    isPrivate: formData.get("isPrivate") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const { username, displayName, bio, isPrivate } = parsed.data;

  const admin = createAdminClient();
  const { data: reserved } = await admin
    .from("reserved_usernames")
    .select("username")
    .ilike("username", username)
    .maybeSingle();

  if (reserved) {
    return { error: "That username isn't available" };
  }

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existing && existing.id !== user.id) {
    return { error: "That username is already taken" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      bio: bio || null,
      is_private: isPrivate,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Something went wrong. Try again." };
  }

  revalidatePath(`/${username}`);
  revalidatePath("/settings/profile");
  return { success: true, username };
}

export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)
    .select("username")
    .single();

  if (error || !profile) {
    return { error: "Couldn't save your new photo. Try again." };
  }

  revalidatePath(`/${profile.username}`);
  revalidatePath("/settings/profile");
  return { success: true, username: profile.username };
}
