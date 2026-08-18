"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "@/app/(main)/messages/actions";
import { buttonVariants } from "@/components/ui/button";

export function StartConversationButton({
  targetId,
  children,
}: {
  targetId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await startConversation(targetId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (result.conversationId) router.push(`/messages/${result.conversationId}`);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {children}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
