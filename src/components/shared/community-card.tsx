import Link from "next/link";

export function CommunityCard({
  slug,
  name,
  description,
  emoji,
  memberCount,
}: {
  slug: string;
  name: string;
  description?: string | null;
  emoji: string;
  memberCount?: number;
}) {
  return (
    <Link
      href={`/community/${slug}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:bg-surface-muted"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-xl">
        {emoji}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        {typeof memberCount === "number" && (
          <p className="text-xs text-muted-foreground">{memberCount} members</p>
        )}
      </div>
    </Link>
  );
}
