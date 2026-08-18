"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { joinCommunity, leaveCommunity } from "../community-actions";
import { Button, buttonVariants } from "@/components/ui/button";

export function JoinButton({
  communityId,
  slug,
  initialJoined,
  isLoggedIn,
}: {
  communityId: string;
  slug: string;
  initialJoined: boolean;
  isLoggedIn: boolean;
}) {
  const [joined, setJoined] = useState(initialJoined);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link href={`/login?next=/community/${slug}`} className={buttonVariants({ size: "sm" })}>
        Join
      </Link>
    );
  }

  function handleClick() {
    const prev = joined;
    setJoined(!prev);
    startTransition(async () => {
      const result = prev ? await leaveCommunity(communityId, slug) : await joinCommunity(communityId, slug);
      if ("error" in result) setJoined(prev);
    });
  }

  return (
    <Button variant={joined ? "outline" : "primary"} size="sm" loading={pending} onClick={handleClick}>
      {joined ? "Joined" : "Join"}
    </Button>
  );
}
