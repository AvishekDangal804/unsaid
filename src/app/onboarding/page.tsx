import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const profile = await getProfileById(user.id);
  const isEditing = Boolean(
    profile && profile.country && profile.education_level && profile.institution_id,
  );

  let currentInstitutionName: string | null = null;
  if (profile?.institution_id) {
    const supabase = await createClient();
    const { data: institution } = await supabase
      .from("institutions")
      .select("name")
      .eq("id", profile.institution_id)
      .maybeSingle();
    currentInstitutionName = institution?.name ?? null;
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-foreground">
        {isEditing ? "Your location & education" : "Tell us where you're from"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This helps us keep UNSAID safe and connect you with your community.
      </p>
      <OnboardingForm
        initialCountry={profile?.country ?? undefined}
        initialEducationLevel={profile?.education_level ?? undefined}
        initialInstitutionId={profile?.institution_id ?? undefined}
        initialInstitutionName={currentInstitutionName ?? undefined}
        submitLabel={isEditing ? "Save changes" : "Continue to UNSAID"}
      />
    </div>
  );
}
