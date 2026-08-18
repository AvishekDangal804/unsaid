"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { followUser, unfollowUser } from "../follow-actions";
import { Button, buttonVariants } from "@/components/ui/button";

type Relationship = "none" | "pending" | "accepted";

export function FollowButton({
  targetId,
  targetUsername,
  targetIsPrivate,
  initialRelationship,
  isLoggedIn,
}: {
  targetId: string;
  targetUsername: string;
  targetIsPrivate: boolean;
  initialRelationship: Relationship;
  isLoggedIn: boolean;
}) {
  const [relationship, setRelationship] = useState<Relationship>(initialRelationship);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link href={`/login?next=/${targetUsername}`} className={buttonVariants({ size: "sm" })}>
        Follow
      </Link>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      if (relationship === "none") {
        const result = await followUser(targetId, targetUsername);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setRelationship(targetIsPrivate ? "pending" : "accepted");
      } else {
        const result = await unfollowUser(targetId, targetUsername);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setRelationship("none");
      }
    });
  }

  const label =
    relationship === "accepted" ? "Following" : relationship === "pending" ? "Requested" : "Follow";

  return (
    <div>
      <Button
        variant={relationship === "none" ? "primary" : "outline"}
        size="sm"
        loading={pending}
        onClick={handleClick}
      >
        {label}
      </Button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
