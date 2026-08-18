"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { performModeration } from "../moderation-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/types/database.types";

export function UserRow({
  userId,
  username,
  status: initialStatus,
  isRestricted: initialRestricted,
}: {
  userId: string;
  username: string;
  status: AccountStatus;
  isRestricted: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isRestricted, setIsRestricted] = useState(initialRestricted);
  const [pending, startTransition] = useTransition();

  function act(action: "suspend" | "ban" | "restrict" | "unrestrict" | "unsuspend" | "unban") {
    startTransition(async () => {
      const result = await performModeration({ action, targetType: "user", targetId: userId });
      if ("error" in result) return;
      if (action === "suspend") setStatus("suspended");
      if (action === "ban") setStatus("banned");
      if (action === "unsuspend" || action === "unban") setStatus("active");
      if (action === "restrict") setIsRestricted(true);
      if (action === "unrestrict") setIsRestricted(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-3">
      <div>
        <Link href={`/${username}`} className="text-sm font-medium text-foreground hover:underline">
          @{username}
        </Link>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs",
              status === "active" ? "text-muted-foreground" : status === "banned" ? "text-danger" : "text-primary",
            )}
          >
            {status}
          </span>
          {isRestricted && <span className="text-xs text-primary">· restricted</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {status === "active" && (
          <>
            <Button size="sm" variant="outline" loading={pending} onClick={() => act("suspend")}>
              Suspend
            </Button>
            <Button size="sm" variant="danger" loading={pending} onClick={() => act("ban")}>
              Ban
            </Button>
            {isRestricted ? (
              <Button size="sm" variant="outline" loading={pending} onClick={() => act("unrestrict")}>
                Unrestrict
              </Button>
            ) : (
              <Button size="sm" variant="outline" loading={pending} onClick={() => act("restrict")}>
                Restrict
              </Button>
            )}
          </>
        )}
        {status === "suspended" && (
          <Button size="sm" variant="outline" loading={pending} onClick={() => act("unsuspend")}>
            Lift suspension
          </Button>
        )}
        {status === "banned" && (
          <Button size="sm" variant="outline" loading={pending} onClick={() => act("unban")}>
            Unban
          </Button>
        )}
      </div>
    </div>
  );
}
