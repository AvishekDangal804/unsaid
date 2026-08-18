import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { WhoCanMessageForm } from "./who-can-message-form";

export default async function PrivacySettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/settings/privacy");
  }

  const profile = await getProfileById(user.id);

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Privacy</h1>
      <p className="mb-6 text-sm text-muted-foreground">Control who can reach you.</p>

      <h2 className="mb-2 text-sm font-medium text-foreground">Who can message you</h2>
      <WhoCanMessageForm initial={profile?.who_can_message ?? "everyone"} />
    </div>
  );
}
