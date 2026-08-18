"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

export async function markNotificationsRead(ids: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .eq("recipient_id", user.id);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/notifications");
  return { success: true };
}

export async function clearNotifications(ids: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .in("id", ids)
    .eq("recipient_id", user.id);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/notifications");
  return { success: true };
}

export async function clearAllNotifications(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.from("notifications").delete().eq("recipient_id", user.id);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/notifications");
  return { success: true };
}
