import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "./preferences-form";

export default async function NotificationSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/settings/notifications");
  }

  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Notifications</h1>
      <p className="mb-6 text-sm text-muted-foreground">Choose what you want to hear about.</p>
      <PreferencesForm
        initial={
          prefs ?? {
            reactions: true,
            comments: true,
            replies: true,
            follows: true,
            mentions: true,
            quiet_mode: false,
          }
        }
      />
    </div>
  );
}
