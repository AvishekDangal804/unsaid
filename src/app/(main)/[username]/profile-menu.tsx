"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Flag, VolumeX, Volume2, Ban } from "lucide-react";
import { muteUser, unmuteUser, blockUser, unblockUser } from "@/app/(main)/safety-actions";
import { ReportDialog } from "@/components/shared/report-dialog";
import { useDismissableMenu } from "@/lib/hooks/use-dismissable-menu";

export function ProfileMenu({
  targetId,
  targetUsername,
  initialMuted,
  initialBlocked,
}: {
  targetId: string;
  targetUsername: string;
  initialMuted: boolean;
  initialBlocked: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [muted, setMuted] = useState(initialMuted);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDismissableMenu<HTMLDivElement>(open, setOpen, triggerRef);

  function handleToggleMute() {
    setOpen(false);
    const next = !muted;
    setMuted(next);
    startTransition(async () => {
      const result = next ? await muteUser(targetId) : await unmuteUser(targetId);
      if ("error" in result) setMuted(!next);
    });
  }

  function handleToggleBlock() {
    setOpen(false);
    const next = !blocked;
    if (next && !window.confirm(`Block @${targetUsername}? They won't be able to see your posts or message you.`)) {
      return;
    }
    setBlocked(next);
    startTransition(async () => {
      const result = next
        ? await blockUser(targetId, targetUsername)
        : await unblockUser(targetId, targetUsername);
      if ("error" in result) {
        setBlocked(!next);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-muted"
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
            onClick={handleToggleMute}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
          >
            {muted ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            {muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleToggleBlock}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-muted"
          >
            <Ban className="size-4" />
            {blocked ? "Unblock" : "Block"}
          </button>
        </div>
      )}

      {reportOpen && (
        <ReportDialog targetType="user" targetId={targetId} onCloseAction={() => setReportOpen(false)} />
      )}
    </div>
  );
}
