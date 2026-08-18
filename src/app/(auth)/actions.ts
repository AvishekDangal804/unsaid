"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export type ActionResult = { error: string } | { success: true };
export type SignupResult = { error: string } | { success: true; confirmed: boolean };

export async function signup(formData: FormData): Promise<SignupResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    dateOfBirth: formData.get("dateOfBirth"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const { email, username, password, dateOfBirth } = parsed.data;

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

  if (existing) {
    return { error: "That username is already taken" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, date_of_birth: dateOfBirth },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmations are disabled in Supabase, signUp already returns
  // a live session (cookies are set above) — no inbox step needed.
  return { success: true, confirmed: data.session !== null };
}

export async function login(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const { identifier, password } = parsed.data;
  let email = identifier;

  if (!identifier.includes("@")) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", identifier)
      .maybeSingle();

    if (!profile) {
      return { error: "Incorrect username or password" };
    }

    const { data: userData } = await admin.auth.admin.getUserById(profile.id);
    if (!userData.user?.email) {
      return { error: "Incorrect username or password" };
    }
    email = userData.user.email;
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email/username or password" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, suspended_until")
    .eq("id", signInData.user.id)
    .maybeSingle();

  if (profile?.status === "banned") {
    await supabase.auth.signOut();
    return { error: "This account has been banned." };
  }

  if (profile?.status === "suspended") {
    const until = profile.suspended_until ? new Date(profile.suspended_until) : null;
    if (until && until > new Date()) {
      await supabase.auth.signOut();
      return {
        error: `This account is suspended until ${until.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.`,
      };
    }
    await supabase.rpc("clear_expired_suspension", { p_user_id: signInData.user.id });
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Always succeed to avoid revealing whether an email is registered.
  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
