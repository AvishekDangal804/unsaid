"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Bookmark, Flag, Link2, Trash2, EyeOff } from "lucide-react";
import { toggleSave, deletePost, hidePost } from "@/app/(main)/post-actions";
import { ReportDialog } from "@/components/shared/report-dialog";

export function PostMenu({
  postId,
  isOwn,
  initialSaved,
  onHideAction,
}: {
  postId: string;
  isOwn: boolean;
  initialSaved: boolean;
  onHideAction?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [deleted, setDeleted] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  }

  function handleHide() {
    setOpen(false);
    onHideAction?.();
    startTransition(async () => {
      await hidePost(postId);
    });
  }

  function handleDelete() {
    setOpen(false);
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deletePost(postId);
      if (!("error" in result)) {
        setDeleted(true);
        router.refresh();
      }
    });
  }

  if (deleted) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
        aria-label="More options"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          <button
            type="button"
            onClick={handleSave}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
          >
            <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} />
            {saved ? "Remove from Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
          >
            <Link2 className="size-4" />
            Copy link
          </button>
          {isOwn ? (
            <button
              type="button"
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
                onClick={handleHide}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
              >
                <EyeOff className="size-4" />
                Not interested
              </button>
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
