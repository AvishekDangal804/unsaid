"use client";

import { useRouter } from "next/navigation";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import type { FeedComment } from "@/lib/data/comments";

function organize(comments: FeedComment[]) {
  const byId = new Map(comments.map((c) => [c.id, c]));

  function rootIdOf(comment: FeedComment): string {
    let current = comment;
    const seen = new Set<string>();
    while (current.parentId && byId.has(current.parentId) && !seen.has(current.id)) {
      seen.add(current.id);
      current = byId.get(current.parentId)!;
    }
    return current.id;
  }

  const roots = comments.filter((c) => !c.parentId);
  const repliesByRoot = new Map<string, FeedComment[]>();

  for (const comment of comments) {
    if (!comment.parentId) continue;
    const rootId = rootIdOf(comment);
    const list = repliesByRoot.get(rootId) ?? [];
    list.push(comment);
    repliesByRoot.set(rootId, list);
  }

  return { roots, repliesByRoot };
}

export function CommentsSection({
  postId,
  canModerate,
  commentsEnabled,
  currentUserId,
  comments,
}: {
  postId: string;
  canModerate: boolean;
  commentsEnabled: boolean;
  currentUserId: string | null;
  comments: FeedComment[];
}) {
  const router = useRouter();
  const { roots, repliesByRoot } = organize(comments);

  return (
    <div className="flex flex-col gap-4">
      {commentsEnabled ? (
        currentUserId ? (
          <CommentForm postId={postId} onPostedAction={() => router.refresh()} />
        ) : (
          <p className="text-sm text-muted-foreground">Log in to join the conversation.</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground">Comments are turned off for this post.</p>
      )}

      {roots.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No comments yet. Say something first.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {roots.map((root) => (
            <div key={root.id} className="flex flex-col gap-3">
              <CommentItem
                comment={root}
                postId={postId}
                canModerate={canModerate}
                onReplyPostedAction={() => router.refresh()}
              />
              {(repliesByRoot.get(root.id) ?? []).map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} canModerate={canModerate} isReply />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
