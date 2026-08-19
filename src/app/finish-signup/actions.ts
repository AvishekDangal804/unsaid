"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finishSignupSchema } from "@/lib/validation/auth";

export type ActionResult = { error: string } | { success: true };

export async function completeFinishSignup(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to log in first" };

  const parsed = finishSignupSchema.safeParse({
    username: formData.get("username"),
    dateOfBirth: formData.get("dateOfBirth"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again" };
  }

  const { username, dateOfBirth } = parsed.data;

  const admin = createAdminClient();
  const { data: reserved } = await admin
    .from("reserved_usernames")
    .select("username")
    .ilike("username", username)
    .maybeSingle();

  if (reserved) return { error: "That username isn't available" };

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) return { error: "That username is already taken" };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ username, oauth_setup_pending: false })
    .eq("id", user.id);

  if (profileError) return { error: "Something went wrong. Try again." };

  const { error: dobError } = await supabase
    .from("account_private")
    .upsert({ id: user.id, date_of_birth: dateOfBirth });

  if (dobError) return { error: "Something went wrong. Try again." };

  return { success: true };
}
