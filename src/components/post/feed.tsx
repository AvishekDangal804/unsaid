"use client";

import { useState, useTransition } from "react";
import { loadFeedPage } from "@/app/(main)/feed-actions";
import { PostCard } from "./post-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/data/posts";

export function Feed({
  initialPosts,
  initialCursor,
  initialScope,
  currentUserId,
  showTabs,
}: {
  initialPosts: FeedPost[];
  initialCursor: string | null;
  initialScope: "latest" | "following";
  currentUserId: string | null;
  showTabs: boolean;
}) {
  const [scope, setScope] = useState(initialScope);
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, startTransition] = useTransition();

  function switchScope(next: "latest" | "following") {
    if (next === scope) return;
    setScope(next);
    startTransition(async () => {
      const result = await loadFeedPage(next);
      setPosts(result.posts);
      setCursor(result.nextCursor);
    });
  }

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadFeedPage(scope, cursor);
      setPosts((prev) => [...prev, ...result.posts]);
      setCursor(result.nextCursor);
    });
  }

  return (
    <div>
      {showTabs && (
        <div className="mb-4 flex gap-1 border-b border-border">
          {(["following", "latest"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchScope(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium capitalize -mb-px border-b-2",
                scope === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {posts.length === 0 && !pending ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <p className="text-sm text-muted-foreground">
            {scope === "following"
              ? "Follow people to see their posts here, or check Latest to discover new voices."
              : "Nothing here yet. Be the first to share something."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {cursor && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" loading={pending} onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
