import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { ConversationSummary } from "@/lib/data/messages";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ConversationListItem({ conversation }: { conversation: ConversationSummary }) {
  const { otherUser } = conversation;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
    >
      <Avatar src={otherUser.avatarUrl} name={otherUser.displayName ?? otherUser.username} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {otherUser.displayName || otherUser.username}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <p className={`truncate text-xs ${hasUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {conversation.lastMessagePreview ?? "Say hello"}
        </p>
      </div>
      {hasUnread && <span className="size-2.5 shrink-0 rounded-full bg-primary" />}
    </Link>
  );
}
