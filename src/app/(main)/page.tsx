import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { getFeedPosts } from "@/lib/data/posts";
import { buttonVariants } from "@/components/ui/button";
import { CompleteProfileBanner } from "@/components/shared/complete-profile-banner";
import { Feed } from "@/components/post/feed";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getProfileById(user.id);
    const profileIncomplete =
      profile && !profile.display_name && !profile.bio && !profile.avatar_url;

    const { posts, nextCursor } = await getFeedPosts({ scope: "latest", userId: user.id });

    return (
      <div>
        {profileIncomplete && <CompleteProfileBanner userId={user.id} />}
        <Feed
          initialPosts={posts}
          initialCursor={nextCursor}
          initialScope="latest"
          currentUserId={user.id}
          showTabs={false}
        />
      </div>
    );
  }

  const { posts, nextCursor } = await getFeedPosts({ scope: "latest", userId: null });

  return (
    <div>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-8 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Every feeling has a story.
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
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

      <div className="mt-6">
        <Feed
          initialPosts={posts}
          initialCursor={nextCursor}
          initialScope="latest"
          currentUserId={null}
          showTabs={false}
        />
      </div>
    </div>
  );
}
