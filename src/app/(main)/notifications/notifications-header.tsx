"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { clearAllNotifications } from "./actions";
import { Button } from "@/components/ui/button";

export function NotificationsHeader({ hasItems }: { hasItems: boolean }) {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClearAll() {
    if (!window.confirm("Clear all notifications? This can't be undone.")) return;
    setCleared(true);
    startTransition(async () => {
      await clearAllNotifications();
      router.refresh();
    });
  }

  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
      <div className="flex items-center gap-2">
        {hasItems && !cleared && (
          <Button variant="ghost" size="sm" loading={pending} onClick={handleClearAll}>
            Clear all
          </Button>
        )}
        <Link
          href="/settings/notifications"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
          aria-label="Notification settings"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </div>
  );
}
