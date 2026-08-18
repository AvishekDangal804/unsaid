"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Repeat2, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ReactionBar } from "./reaction-bar";
import { PollDisplay } from "./poll-display";
import { PostImageGrid } from "./post-image-grid";
import { PostMenu } from "./post-menu";
import { PostContent } from "./post-content";
import { toggleRepost } from "@/app/(main)/post-actions";
import { cn } from "@/lib/utils";
import { MOOD_META } from "@/lib/moods";
import type { FeedPost } from "@/lib/data/posts";

const TYPE_LABEL: Record<string, string> = {
  post: "",
  confession: "❤️ Confession",
  story: "📖 Story",
  question: "❓ Question",
  poll: "🗳️ Poll",
  photo: "📸 Photo",
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: string | null }) {
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [reposted, setReposted] = useState(post.isReposted);
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const isOwn = post.isOwnPost;
  const showWarning = post.contentWarning && !warningDismissed;

  function handleRepost() {
    const prevReposted = reposted;
    const prevCount = repostCount;
    setReposted(!prevReposted);
    setRepostCount(prevReposted ? prevCount - 1 : prevCount + 1);
    toggleRepost(post.id).then((result) => {
      if ("error" in result) {
        setReposted(prevReposted);
        setRepostCount(prevCount);
      }
    });
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {post.author ? (
            <Link href={`/${post.author.username}`}>
              <Avatar
                src={post.author.avatarUrl}
                name={post.author.displayName ?? post.author.username}
                size={40}
              />
            </Link>
          ) : (
            <Avatar src={null} name="Anonymous" size={40} />
          )}
          <div className="min-w-0">
            {post.author ? (
              <Link
                href={`/${post.author.username}`}
                className="block truncate text-sm font-medium text-foreground hover:underline"
              >
                {post.author.displayName || post.author.username}
              </Link>
            ) : (
              <span className="block text-sm font-medium text-foreground">Anonymous</span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{timeAgo(post.createdAt)}</span>
              {TYPE_LABEL[post.type] && <span>· {TYPE_LABEL[post.type]}</span>}
              {post.mood && <span>{MOOD_META[post.mood].emoji}</span>}
            </div>
          </div>
        </div>
        <PostMenu
          postId={post.id}
          isOwn={isOwn}
          initialSaved={post.isSaved}
          onHideAction={() => setHidden(true)}
        />
      </div>

      <div className="mt-3">
        {showWarning ? (
          <button
            type="button"
            onClick={() => setWarningDismissed(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-muted-foreground"
          >
            <AlertTriangle className="size-4" />
            {post.contentWarning} · Tap to view
          </button>
        ) : (
          <>
            {post.content && (
              <PostContent
                content={post.content}
                className={post.type === "story" ? "text-sm leading-relaxed" : "text-[15px]"}
              />
            )}

            {post.categoryLabel && (
              <span className="mt-2 inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {post.categoryLabel}
              </span>
            )}

            {post.type === "poll" && (
              <div className="mt-3">
                <PollDisplay
                  postId={post.id}
                  options={post.pollOptions}
                  initialMyVote={post.myPollVote}
                  initialTotal={post.totalPollVotes}
                  isLoggedIn={Boolean(currentUserId)}
                />
              </div>
            )}

            {post.media.length > 0 && (
              <div className="mt-3">
                <PostImageGrid images={post.media} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
        <ReactionBar
          target={{ postId: post.id }}
          initialCounts={post.reactionCounts}
          initialMyReaction={post.myReaction}
        />

        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-muted"
        >
          <MessageCircle className="size-4" />
          {post.commentCount > 0 && post.commentCount}
        </Link>

        <button
          type="button"
          onClick={handleRepost}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-surface-muted",
            reposted ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Repeat2 className="size-4" />
          {repostCount > 0 && repostCount}
        </button>
      </div>
    </article>
  );
}
