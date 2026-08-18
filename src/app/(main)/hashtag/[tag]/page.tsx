import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getFeedPosts } from "@/lib/data/posts";
import { Feed } from "@/components/post/feed";
import { Hash } from "lucide-react";

export async function generateMetadata({ params }: PageProps<"/hashtag/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag}` };
}

export default async function HashtagPage({ params }: PageProps<"/hashtag/[tag]">) {
  const { tag } = await params;
  const user = await getCurrentUser();
  const { posts, nextCursor } = await getFeedPosts({
    scope: "latest",
    userId: user?.id ?? null,
    filter: { hashtag: tag },
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-foreground">
        <Hash className="size-5 text-primary" />
        {tag}
      </h1>
      <Feed
        initialPosts={posts}
        initialCursor={nextCursor}
        initialScope="latest"
        currentUserId={user?.id ?? null}
        showTabs={false}
        filter={{ hashtag: tag }}
        emptyMessage="No posts with this hashtag yet."
      />
    </div>
  );
}
