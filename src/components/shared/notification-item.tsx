"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { clearNotifications } from "@/app/(main)/notifications/actions";
import { cn } from "@/lib/utils";
import type { NotificationItem as NotificationItemType } from "@/lib/data/notifications";

const TYPE_ICON: Record<string, string> = {
  follow: "👋",
  follow_request: "🔒",
  follow_accepted: "✅",
  reaction_post: "❤️",
  reaction_comment: "❤️",
  comment: "💬",
  reply: "↩️",
  mention_post: "📣",
  mention_comment: "📣",
  message: "✉️",
  system: "🔔",
};

function actorLabel(item: NotificationItemType): string {
  const [first, ...rest] = item.actors;
  const name = first.username ? (first.displayName || first.username) : "Someone";

  if (item.actors.length === 1 && item.extraCount === 0) return name;

  const totalOthers = rest.length + item.extraCount;
  return `${name} and ${totalOthers} other${totalOthers === 1 ? "" : "s"}`;
}

function messageFor(item: NotificationItemType): string {
  const who = actorLabel(item);
  switch (item.type) {
    case "follow":
      return `${who} started following you`;
    case "follow_request":
      return `${who} wants to follow you`;
    case "follow_accepted":
      return `${who} accepted your follow request`;
    case "reaction_post":
      return `${who} reacted to your post`;
    case "reaction_comment":
      return `${who} reacted to your comment`;
    case "comment":
      return `${who} commented on your post`;
    case "reply":
      return `${who} replied to your comment`;
    case "mention_post":
      return `${who} mentioned you in a post`;
    case "mention_comment":
      return `${who} mentioned you in a comment`;
    case "message":
      return `${who} sent you a message`;
    case "system":
      return item.message ?? "New notification";
    default:
      return "New notification";
  }
}

function hrefFor(item: NotificationItemType): string | null {
  if (item.type === "follow" || item.type === "follow_accepted") {
    return item.actors[0].username ? `/${item.actors[0].username}` : null;
  }
  if (item.type === "follow_request") return "/requests";
  if (item.targetType === "post" && item.targetId) return `/post/${item.targetId}`;
  if (item.targetType === "conversation" && item.targetId) return `/messages/${item.targetId}`;
  return null;
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationItem({ item }: { item: NotificationItemType }) {
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();
  const href = hrefFor(item);
  const primaryActor = item.actors[0];

  function handleClear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    startTransition(async () => {
      await clearNotifications(item.ids);
    });
  }

  if (dismissed) return null;

  const content = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border px-4 py-3",
        item.isRead ? "bg-surface" : "bg-primary/5",
      )}
    >
      {primaryActor.username ? (
        <Avatar
          src={primaryActor.avatarUrl}
          name={primaryActor.displayName ?? primaryActor.username}
          size={40}
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-lg">
          {TYPE_ICON[item.type] ?? "🔔"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{messageFor(item)}</p>
        <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
      </div>
      <button
        type="button"
        onClick={handleClear}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-surface-muted"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
