import Link from "next/link";
import { cn } from "@/lib/utils";

const TOKEN_SPLIT = /(#[a-zA-Z][a-zA-Z0-9_]{1,29}|@[a-zA-Z0-9_]{3,24})/g;

export function PostContent({ content, className }: { content: string; className?: string }) {
  const parts = content.split(TOKEN_SPLIT);

  return (
    <p className={cn("whitespace-pre-wrap text-foreground", className)}>
      {parts.map((part, i) => {
        if (part.startsWith("#")) {
          return (
            <Link
              key={i}
              href={`/hashtag/${part.slice(1)}`}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@")) {
          return (
            <Link
              key={i}
              href={`/${part.slice(1)}`}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
