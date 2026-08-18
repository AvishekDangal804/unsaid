"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pin, Trash2, Flag } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ReactionBar } from "./reaction-bar";
import { CommentForm } from "./comment-form";
import { ReportDialog } from "@/components/shared/report-dialog";
import { deleteComment, setCommentPinned } from "@/app/(main)/post-actions";
import type { FeedComment } from "@/lib/data/comments";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function CommentItem({
  comment,
  postId,
  canModerate,
  isReply = false,
  onReplyPostedAction,
}: {
  comment: FeedComment;
  postId: string;
  canModerate: boolean;
  isReply?: boolean;
  onReplyPostedAction?: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [pinned, setPinned] = useState(comment.isPinned);
  const [, startTransition] = useTransition();

  const isOwn = comment.isOwnComment;

  if (deleted) return null;

  function handleDelete() {
    if (!window.confirm("Delete this comment?")) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (!("error" in result)) setDeleted(true);
    });
  }

  function handlePin() {
    const next = !pinned;
    setPinned(next);
    startTransition(async () => {
      const result = await setCommentPinned(comment.id, next);
      if ("error" in result) setPinned(!next);
    });
  }

  return (
    <div className={isReply ? "ml-10" : ""}>
      <div className="flex gap-2.5">
        {comment.author ? (
          <Link href={`/${comment.author.username}`}>
            <Avatar
              src={comment.author.avatarUrl}
              name={comment.author.displayName ?? comment.author.username}
              size={32}
            />
          </Link>
        ) : (
          <Avatar src={null} name="Anonymous" size={32} />
        )}
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-surface-muted px-3 py-2">
            <div className="flex items-center gap-1.5">
              {comment.author ? (
                <Link
                  href={`/${comment.author.username}`}
                  className="text-xs font-medium text-foreground hover:underline"
                >
                  {comment.author.displayName || comment.author.username}
                </Link>
              ) : (
                <span className="text-xs font-medium text-foreground">Anonymous</span>
              )}
              {pinned && <Pin className="size-3 text-primary" />}
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
          </div>

          <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted-foreground">
            <span>{timeAgo(comment.createdAt)}</span>
            <ReactionBar
              target={{ commentId: comment.id }}
              initialCounts={comment.reactionCounts}
              initialMyReaction={comment.myReaction}
            />
            {!isReply && (
              <button type="button" onClick={() => setReplying((v) => !v)} className="hover:underline">
                Reply
              </button>
            )}
            {canModerate && (
              <button type="button" onClick={handlePin} className="hover:underline">
                {pinned ? "Unpin" : "Pin"}
              </button>
            )}
            {(isOwn || canModerate) && (
              <button type="button" onClick={handleDelete} className="hover:underline">
                <Trash2 className="size-3.5" />
              </button>
            )}
            {!isOwn && (
              <button type="button" onClick={() => setReportOpen(true)} className="hover:underline">
                <Flag className="size-3.5" />
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                autoFocus
                onPostedAction={() => {
                  setReplying(false);
                  onReplyPostedAction?.();
                }}
              />
            </div>
          )}
        </div>
      </div>

      {reportOpen && (
        <ReportDialog targetType="comment" targetId={comment.id} onCloseAction={() => setReportOpen(false)} />
      )}
    </div>
  );
}
