"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WhoCanMessage } from "@/types/database.types";

export type ActionResult = { error: string } | { success: true };

export async function updateWhoCanMessage(value: WhoCanMessage): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("profiles")
    .update({ who_can_message: value })
    .eq("id", user.id);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/settings/privacy");
  return { success: true };
}
