"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MessagesLink({ userId, initialUnread }: { userId: string; initialUnread: boolean }) {
  const [hasUnread, setHasUnread] = useState(initialUnread);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => setHasUnread(true),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/messages"
      onClick={() => setHasUnread(false)}
      className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
      aria-label="Messages"
    >
      <Mail className="size-4" />
      {hasUnread && (
        <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
      )}
    </Link>
  );
}
