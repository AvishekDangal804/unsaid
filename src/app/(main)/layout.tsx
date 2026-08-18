import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Header, HeaderSkeleton } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let profile = user ? await getProfileById(user.id) : null;

  if (
    profile?.status === "suspended" &&
    profile.suspended_until &&
    new Date(profile.suspended_until) < new Date()
  ) {
    const supabase = await createClient();
    await supabase.rpc("clear_expired_suspension", { p_user_id: user!.id });
    // getProfileById is cache()-wrapped per request, so re-calling it here
    // would just return the stale pre-clear value — override locally instead.
    profile = { ...profile, status: "active", suspended_until: null };
  }

  if (profile?.status === "banned" || profile?.status === "suspended") {
    redirect("/suspended");
  }

  if (profile && (!profile.country || !profile.education_level || !profile.institution_id)) {
    redirect("/onboarding");
  }

  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-20 sm:pb-6">
        {children}
      </main>
      {user && profile && (
        <MobileNav userId={user.id} username={profile.username} initialUnreadCount={unreadCount} />
      )}
    </>
  );
}
