"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function CompleteProfileBanner({ userId }: { userId: string }) {
  const storageKey = `unsaid:onboarding-dismissed:${userId}`;
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(storageKey) === "1",
  );

  if (dismissed) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3">
      <p className="text-sm text-foreground">
        Add a photo and bio so people know it&apos;s you.{" "}
        <Link href="/settings/profile" className="font-medium text-primary hover:underline">
          Complete your profile
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(storageKey, "1");
          setDismissed(true);
        }}
        className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-border"
        aria-label="Skip for now"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
