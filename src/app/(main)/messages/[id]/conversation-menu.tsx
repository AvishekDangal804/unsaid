"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { deleteConversationForMe } from "../actions";
import { useDismissableMenu } from "@/lib/hooks/use-dismissable-menu";

export function ConversationMenu({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDismissableMenu<HTMLDivElement>(open, setOpen, triggerRef);

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
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
        aria-label="Conversation options"
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
