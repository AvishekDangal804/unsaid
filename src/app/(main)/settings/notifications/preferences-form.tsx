"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreferences } from "./actions";
import { Button } from "@/components/ui/button";

const TOGGLES: { key: "reactions" | "comments" | "replies" | "follows" | "mentions"; label: string }[] = [
  { key: "reactions", label: "Reactions" },
  { key: "comments", label: "Comments" },
  { key: "replies", label: "Replies" },
  { key: "follows", label: "Follows" },
  { key: "mentions", label: "Mentions" },
];

export function PreferencesForm({
  initial,
}: {
  initial: {
    reactions: boolean;
    comments: boolean;
    replies: boolean;
    follows: boolean;
    mentions: boolean;
    quiet_mode: boolean;
  };
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateNotificationPreferences(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {TOGGLES.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">{label}</span>
            <input
              type="checkbox"
              name={key}
              defaultChecked={initial[key]}
              className="size-4 accent-primary"
            />
          </label>
        ))}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4">
        <input
          type="checkbox"
          name="quietMode"
          defaultChecked={initial.quiet_mode}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">Quiet mode</span>
          <span className="block text-xs text-muted-foreground">
            Pause all notifications, regardless of the settings above.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {saved && !error && <p className="text-sm text-success">Saved.</p>}

      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        Save changes
      </Button>
    </form>
  );
}
