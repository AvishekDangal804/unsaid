import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { FinishSignupForm } from "./finish-signup-form";

export const metadata = { title: "Finish signing up" };

export default async function FinishSignupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/finish-signup");
  }

  const profile = await getProfileById(user.id);

  if (profile && !profile.oauth_setup_pending) {
    redirect("/");
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Finish setting up</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        You signed in with Facebook — just need a couple more things.
      </p>
      <FinishSignupForm suggestedUsername={profile?.username ?? ""} />
    </div>
  );
}
