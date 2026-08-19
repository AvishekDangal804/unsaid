import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { GroupSummary } from "@/lib/data/groups";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function groupTitle(group: GroupSummary) {
  if (group.name) return group.name;
  const names = group.otherMembers.map((m) => m.displayName || m.username);
  return names.length > 0 ? names.join(", ") : "Group";
}

export function GroupListItem({ group }: { group: GroupSummary }) {
  const first = group.otherMembers[0];

  return (
    <Link
      href={`/messages/group/${group.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
    >
      {first ? (
        <Avatar src={first.avatarUrl} name={first.displayName ?? first.username} size={44} />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
          <Users className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{groupTitle(group)}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(group.lastMessageAt)}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {group.lastMessagePreview ?? `${group.memberCount} members`}
        </p>
      </div>
    </Link>
  );
}
