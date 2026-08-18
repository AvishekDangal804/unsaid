"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Bookmark, Flag, Link2, Trash2, EyeOff, VolumeX, Ban } from "lucide-react";
import { toggleSave, deletePost, hidePost } from "@/app/(main)/post-actions";
import { muteUser, blockUser } from "@/app/(main)/safety-actions";
import { ReportDialog } from "@/components/shared/report-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { useDismissableMenu } from "@/lib/hooks/use-dismissable-menu";

export function PostMenu({
  postId,
  isOwn,
  initialSaved,
  authorId,
  onHideAction,
}: {
  postId: string;
  isOwn: boolean;
  initialSaved: boolean;
  authorId?: string | null;
  onHideAction?: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [deleted, setDeleted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDismissableMenu<HTMLDivElement>(open, setOpen, triggerRef);

  function handleSave() {
    setOpen(false);
    const prev = saved;
    setSaved(!prev);
    startTransition(async () => {
      const result = await toggleSave(postId);
      if ("error" in result) setSaved(prev);
    });
  }

  function handleCopyLink() {
    setOpen(false);
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    showToast("Link copied");
  }

  function handleHide() {
    setOpen(false);
    onHideAction?.();
    startTransition(async () => {
      const result = await hidePost(postId);
      if ("error" in result) showToast(result.error, "error");
    });
  }

  function handleMute() {
    setOpen(false);
    if (!authorId) return;
    setMuted(true);
    startTransition(async () => {
      const result = await muteUser(authorId);
      if ("error" in result) {
        setMuted(false);
        showToast(result.error, "error");
      } else {
        router.refresh();
      }
    });
  }

  function handleBlock() {
    setOpen(false);
    if (!authorId) return;
    if (!window.confirm("Block this person? They won't be able to see your posts or message you.")) return;
    setBlocked(true);
    startTransition(async () => {
      const result = await blockUser(authorId, "");
      if ("error" in result) {
        setBlocked(false);
        showToast(result.error, "error");
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    setOpen(false);
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deletePost(postId);
      if ("error" in result) {
        showToast(result.error, "error");
      } else {
        setDeleted(true);
        router.refresh();
      }
    });
  }

  if (deleted || muted || blocked) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleSave}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
          >
            <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} />
            {saved ? "Remove from Saved" : "Save"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
          >
            <Link2 className="size-4" />
            Copy link
          </button>
          {isOwn ? (
            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-muted"
            >
              <Trash2 className="size-4" />
              Delete post
            </button>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setReportOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
              >
                <Flag className="size-4" />
                Report
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleHide}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
              >
                <EyeOff className="size-4" />
                Not interested
              </button>
              {authorId && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleMute}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
                  >
                    <VolumeX className="size-4" />
                    Mute user
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleBlock}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-muted"
                  >
                    <Ban className="size-4" />
                    Block user
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {reportOpen && (
        <ReportDialog targetType="post" targetId={postId} onCloseAction={() => setReportOpen(false)} />
      )}
    </div>
  );
}
