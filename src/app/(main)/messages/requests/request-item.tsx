"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { acceptConversation, declineConversation } from "../actions";
import type { ConversationSummary } from "@/lib/data/messages";

export function MessageRequestItem({ conversation }: { conversation: ConversationSummary }) {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [pending, startTransition] = useTransition();
  const { otherUser } = conversation;

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptConversation(conversation.id);
      if (!("error" in result)) setStatus("accepted");
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const result = await declineConversation(conversation.id);
      if (!("error" in result)) setStatus("declined");
    });
  }

  if (status === "accepted") {
    return (
      <Link
        href={`/messages/${conversation.id}`}
        className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground"
      >
        Accepted — open conversation with @{otherUser.username}
      </Link>
    );
  }

  if (status === "declined") {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
        You declined @{otherUser.username}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <Avatar src={otherUser.avatarUrl} name={otherUser.displayName ?? otherUser.username} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {otherUser.displayName || otherUser.username}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {conversation.lastMessagePreview ?? "Wants to message you"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={handleAccept}>
          Accept
        </Button>
        <Button size="sm" variant="outline" loading={pending} onClick={handleDecline}>
          Decline
        </Button>
      </div>
    </div>
  );
}
