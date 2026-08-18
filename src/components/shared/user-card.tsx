import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function UserCard({
  username,
  displayName,
  avatarUrl,
  bio,
}: {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
}) {
  return (
    <Link
      href={`/${username}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:bg-surface-muted"
    >
      <Avatar src={avatarUrl} name={displayName ?? username} size={44} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{displayName || username}</p>
        <p className="truncate text-xs text-muted-foreground">@{username}</p>
        {bio && <p className="mt-0.5 truncate text-xs text-muted-foreground">{bio}</p>}
      </div>
    </Link>
  );
}
