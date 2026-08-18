import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Header, HeaderSkeleton } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { getUnreadNotificationCount } from "@/lib/data/notifications";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const profile = user ? await getProfileById(user.id) : null;

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
