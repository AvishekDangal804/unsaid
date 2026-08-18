import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getFeedPosts } from "@/lib/data/posts";
import { Feed } from "@/components/post/feed";
import { MOOD_META } from "@/lib/moods";
import type { Mood } from "@/types/database.types";

function isMood(value: string): value is Mood {
  return value in MOOD_META;
}

export async function generateMetadata({ params }: PageProps<"/mood/[mood]">): Promise<Metadata> {
  const { mood } = await params;
  return { title: isMood(mood) ? MOOD_META[mood].label : "Mood" };
}

export default async function MoodPage({ params }: PageProps<"/mood/[mood]">) {
  const { mood } = await params;
  if (!isMood(mood)) notFound();

  const user = await getCurrentUser();
  const { posts, nextCursor } = await getFeedPosts({
    scope: "latest",
    userId: user?.id ?? null,
    filter: { mood },
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {MOOD_META[mood].emoji} {MOOD_META[mood].label}
      </h1>
      <Feed
        initialPosts={posts}
        initialCursor={nextCursor}
        initialScope="latest"
        currentUserId={user?.id ?? null}
        showTabs={false}
        filter={{ mood }}
        emptyMessage="Nothing here yet."
      />
    </div>
  );
}
