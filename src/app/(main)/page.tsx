import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { buttonVariants } from "@/components/ui/button";
import { CompleteProfileBanner } from "@/components/shared/complete-profile-banner";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getProfileById(user.id);
    const profileIncomplete =
      profile && !profile.display_name && !profile.bio && !profile.avatar_url;

    return (
      <div>
        {profileIncomplete && <CompleteProfileBanner userId={user.id} />}
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
          <h1 className="text-xl font-semibold text-foreground">You&apos;re all caught up.</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your feed is coming soon — this is where confessions, stories, and thoughts from
            people you follow will show up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Every feeling has a story.
        </h1>
        <p className="mx-auto max-w-md text-base text-muted-foreground">
          Share instant thoughts, confessions, and stories — with your name, or anonymously.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Get started
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Log in
        </Link>
      </div>
    </div>
  );
}
