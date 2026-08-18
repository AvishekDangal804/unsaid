"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { PostType } from "@/types/database.types";

const TITLE_ID = "create-post-menu-title";

const OPTIONS: { type: PostType; emoji: string; label: string }[] = [
  { type: "post", emoji: "📝", label: "Post" },
  { type: "photo", emoji: "📸", label: "Photo" },
  { type: "confession", emoji: "❤️", label: "Confession" },
  { type: "story", emoji: "📖", label: "Story" },
  { type: "poll", emoji: "🗳️", label: "Poll" },
  { type: "question", emoji: "❓", label: "Question" },
];

export function CreatePostMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function pick(type: PostType) {
    setOpen(false);
    router.push(`/create?type=${type}`);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
        aria-label="Create post"
      >
        <Plus className="size-5" />
      </button>

      {open && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={TITLE_ID}
            className="animate-sheet-in w-full max-w-sm rounded-t-2xl border border-border bg-surface p-5 shadow-lg sm:rounded-2xl"
          >
            <h2 id={TITLE_ID} className="mb-4 text-base font-semibold text-foreground">
              What&apos;s on your mind?
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => pick(opt.type)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 hover:bg-surface-muted"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
