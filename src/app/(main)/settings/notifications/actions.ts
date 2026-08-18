"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

export async function updateNotificationPreferences(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("notification_preferences")
    .update({
      reactions: formData.get("reactions") === "on",
      comments: formData.get("comments") === "on",
      replies: formData.get("replies") === "on",
      follows: formData.get("follows") === "on",
      mentions: formData.get("mentions") === "on",
      quiet_mode: formData.get("quietMode") === "on",
    })
    .eq("user_id", user.id);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/settings/notifications");
  return { success: true };
}
