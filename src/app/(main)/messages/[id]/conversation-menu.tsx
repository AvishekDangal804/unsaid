"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { deleteConversationForMe } from "../actions";

export function ConversationMenu({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  function handleDelete() {
    setOpen(false);
    if (!window.confirm("Delete this conversation? It will reappear if they message you again.")) return;
    startTransition(async () => {
      const result = await deleteConversationForMe(conversationId);
      if (!("error" in result)) router.push("/messages");
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
        aria-label="Conversation options"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-muted"
          >
            <Trash2 className="size-4" />
            Delete conversation
          </button>
        </div>
      )}
    </div>
  );
}
