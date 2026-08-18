"use client";

import { useRef, useState, useTransition } from "react";
import { toggleReaction } from "@/app/(main)/post-actions";
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
  const [counts, setCounts] = useState(initialCounts);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDismissableMenu<HTMLDivElement>(pickerOpen, setPickerOpen, triggerRef);

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

    startTransition(async () => {
      const result = await toggleReaction(target, type);
      if ("error" in result) {
        setCounts(prevCounts);
        setMyReaction(prevMine);
      }
    });
  }

  return (
    <div className="relative" ref={containerRef}>
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
        {total > 0 && <span>{total}</span>}
      </button>

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
