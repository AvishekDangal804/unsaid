import Link from "next/link";
import { cn } from "@/lib/utils";

const HASHTAG_SPLIT = /(#[a-zA-Z][a-zA-Z0-9_]{1,29})/g;

export function PostContent({ content, className }: { content: string; className?: string }) {
  const parts = content.split(HASHTAG_SPLIT);

  return (
    <p className={cn("whitespace-pre-wrap text-foreground", className)}>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <Link
            key={i}
            href={`/hashtag/${part.slice(1)}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
