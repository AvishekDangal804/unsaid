import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function SuspendedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(user.id);
  if (!profile || profile.status === "active") redirect("/");

  const isBanned = profile.status === "banned";
  const until = profile.suspended_until ? new Date(profile.suspended_until) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-2 text-lg font-semibold text-foreground">
          {isBanned ? "Account banned" : "Account suspended"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {isBanned
            ? "Your account has been permanently banned for violating our community guidelines."
            : until
              ? `Your account is suspended until ${until.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.`
              : "Your account is temporarily suspended."}
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
