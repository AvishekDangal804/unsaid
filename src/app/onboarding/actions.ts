"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { onboardingSchema } from "@/lib/validation/onboarding";

export type ActionResult = { error: string } | { success: true };

export async function searchInstitutions(query: string) {
  if (query.trim().length < 2) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("institutions")
    .select("id, name, country, status")
    .ilike("name", `%${query.trim()}%`)
    .order("name")
    .limit(10);

  return data ?? [];
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in first" };
  }

  const parsed = onboardingSchema.safeParse({
    country: formData.get("country"),
    educationLevel: formData.get("educationLevel"),
    institutionId: formData.get("institutionId") || undefined,
    newInstitutionName: formData.get("newInstitutionName") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again" };
  }

  const { country, educationLevel, newInstitutionName } = parsed.data;
  let institutionId = parsed.data.institutionId;

  if (!institutionId && newInstitutionName) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("institutions")
      .select("id")
      .ilike("name", newInstitutionName)
      .maybeSingle();

    if (existing) {
      institutionId = existing.id;
    } else {
      const { data: created, error: createError } = await supabase
        .from("institutions")
        .insert({ name: newInstitutionName, country, suggested_by: user.id })
        .select("id")
        .single();

      if (createError || !created) {
        return { error: "Couldn't save that institution. Try again." };
      }
      institutionId = created.id;
    }
  }

  if (!institutionId) {
    return { error: "Choose your school/college, or add it if it's missing" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      country,
      education_level: educationLevel,
      institution_id: institutionId,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Something went wrong. Try again." };
  }

  return { success: true };
}
