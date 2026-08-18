"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { acceptFollowRequest, declineFollowRequest } from "../follow-actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database.types";

export function RequestItem({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptFollowRequest(profile.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setStatus("accepted");
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const result = await declineFollowRequest(profile.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setStatus("declined");
    });
  }

  if (status !== "pending") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
        {status === "accepted" ? `You accepted @${profile.username}` : `You declined @${profile.username}`}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <Link href={`/${profile.username}`}>
        <Avatar src={profile.avatar_url} name={profile.display_name ?? profile.username} size={44} />
      </Link>
      <Link href={`/${profile.username}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {profile.display_name || profile.username}
        </p>
        <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
      </Link>
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={handleAccept}>
          Accept
        </Button>
        <Button size="sm" variant="outline" loading={pending} onClick={handleDecline}>
          Decline
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
