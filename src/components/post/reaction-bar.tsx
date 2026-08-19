"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toggleReaction, getReactors, type Reactor } from "@/app/(main)/post-actions";
import { useToast } from "@/components/shared/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import type { ReactionType } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { useDismissableMenu } from "@/lib/hooks/use-dismissable-menu";

const REACTION_EMOJI: Record<ReactionType, string> = {
  love: "❤️",
  hug: "🫂",
  funny: "😂",
  relatable: "😭",
  angry: "😡",
  fire: "🔥",
};
const REACTION_ORDER: ReactionType[] = ["love", "hug", "funny", "relatable", "angry", "fire"];

export function ReactionBar({
  target,
  initialCounts,
  initialMyReaction,
}: {
  target: { postId: string } | { commentId: string };
  initialCounts: Partial<Record<ReactionType, number>>;
  initialMyReaction: ReactionType | null;
}) {
  const { showToast } = useToast();
  const [counts, setCounts] = useState(initialCounts);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactorsOpen, setReactorsOpen] = useState(false);
  const [reactors, setReactors] = useState<Reactor[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDismissableMenu<HTMLDivElement>(pickerOpen, setPickerOpen, triggerRef);
  const countRef = useRef<HTMLButtonElement>(null);
  const reactorsRef = useDismissableMenu<HTMLDivElement>(reactorsOpen, setReactorsOpen, countRef);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  function pick(type: ReactionType) {
    setPickerOpen(false);

    const prevCounts = counts;
    const prevMine = myReaction;
    const nextCounts = { ...counts };

    if (prevMine) {
      nextCounts[prevMine] = Math.max(0, (nextCounts[prevMine] ?? 0) - 1);
    }
    if (prevMine === type) {
      setMyReaction(null);
    } else {
      nextCounts[type] = (nextCounts[type] ?? 0) + 1;
      setMyReaction(type);
    }
    setCounts(nextCounts);
    setReactors(null);

    startTransition(async () => {
      const result = await toggleReaction(target, type);
      if ("error" in result) {
        setCounts(prevCounts);
        setMyReaction(prevMine);
        showToast(result.error, "error");
      }
    });
  }

  function loadReactors() {
    if (reactors !== null || loadingReactors) return;
    setLoadingReactors(true);
    getReactors(target)
      .then(setReactors)
      .finally(() => setLoadingReactors(false));
  }

  function handleMouseEnter() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setReactorsOpen(true);
    loadReactors();
  }

  function handleMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => setReactorsOpen(false), 150);
  }

  function handleTap() {
    setReactorsOpen((v) => !v);
    loadReactors();
  }

  return (
    <div className="relative flex items-center" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-surface-muted",
          myReaction ? "text-primary" : "text-muted-foreground",
        )}
        aria-haspopup="menu"
        aria-expanded={pickerOpen}
        aria-label="React"
      >
        <span>{myReaction ? REACTION_EMOJI[myReaction] : "🤍"}</span>
      </button>

      {total > 0 && (
        <div className="relative" ref={reactorsRef}>
          <button
            ref={countRef}
            type="button"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleTap}
            className="-ml-1 rounded-full px-1.5 py-1.5 text-sm text-muted-foreground hover:bg-surface-muted"
            aria-haspopup="true"
            aria-expanded={reactorsOpen}
            aria-label={`See who reacted, ${total} total`}
          >
            {total}
          </button>

          {reactorsOpen && (
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="animate-fade-in absolute bottom-full left-0 z-20 mb-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-lg"
            >
              {loadingReactors && !reactors ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">Loading...</p>
              ) : reactors && reactors.length > 0 ? (
                reactors.slice(0, 20).map((r, i) => (
                  <Link
                    key={`${r.username}-${i}`}
                    href={`/${r.username}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted"
                  >
                    <Avatar src={r.avatarUrl} name={r.displayName ?? r.username} size={24} />
                    <span className="truncate">{r.displayName || r.username}</span>
                    <span className="ml-auto shrink-0">{REACTION_EMOJI[r.type]}</span>
                  </Link>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-muted-foreground">No reactions yet</p>
              )}
              {reactors && reactors.length > 20 && (
                <p className="px-3 py-1.5 text-xs text-muted-foreground">+{reactors.length - 20} more</p>
              )}
            </div>
          )}
        </div>
      )}

      {pickerOpen && (
        <div
          role="menu"
          className="animate-fade-in absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full border border-border bg-surface p-1.5 shadow-lg"
        >
          {REACTION_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              role="menuitem"
              onClick={() => pick(type)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125",
                myReaction === type && "bg-surface-muted",
              )}
              aria-label={type}
            >
              {REACTION_EMOJI[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
