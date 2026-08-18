"use client";

import { useState, useTransition } from "react";
import { updateWhoCanMessage } from "./actions";
import type { WhoCanMessage } from "@/types/database.types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: WhoCanMessage; label: string; description: string }[] = [
  { value: "everyone", label: "Everyone", description: "Anyone can send you a message request." },
  { value: "followers", label: "People I follow", description: "Only people you follow can message you." },
  { value: "no_one", label: "No one", description: "Turn off direct messages entirely." },
];

export function WhoCanMessageForm({ initial }: { initial: WhoCanMessage }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSelect(next: WhoCanMessage) {
    setValue(next);
    setSaved(false);
    startTransition(async () => {
      const result = await updateWhoCanMessage(next);
      if (!("error" in result)) setSaved(true);
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left",
              value === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-surface-muted",
            )}
          >
            <p className="text-sm font-medium text-foreground">{option.label}</p>
            <p className="text-xs text-muted-foreground">{option.description}</p>
          </button>
        ))}
      </div>
      {pending && <p className="mt-2 text-xs text-muted-foreground">Saving...</p>}
      {saved && !pending && <p className="mt-2 text-xs text-success">Saved.</p>}
    </div>
  );
}
