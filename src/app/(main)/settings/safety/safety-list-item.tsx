"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { unblockUser, unmuteUser } from "@/app/(main)/safety-actions";

type Person = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export function SafetyListItem({ person, kind }: { person: Person; kind: "blocked" | "muted" }) {
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = kind === "blocked" ? await unblockUser(person.id, person.username) : await unmuteUser(person.id);
      if (!("error" in result)) setRemoved(true);
    });
  }

  if (removed) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <Link href={`/${person.username}`}>
        <Avatar src={person.avatar_url} name={person.display_name ?? person.username} size={40} />
      </Link>
      <Link href={`/${person.username}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {person.display_name || person.username}
        </p>
        <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
      </Link>
      <Button size="sm" variant="outline" loading={pending} onClick={handleRemove}>
        {kind === "blocked" ? "Unblock" : "Unmute"}
      </Button>
    </div>
  );
}
