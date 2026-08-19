"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createGroupAndRedirect } from "../group-actions";

type Friend = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export function NewGroupForm({ friends }: { friends: Friend[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.username.toLowerCase().includes(q) || f.display_name?.toLowerCase().includes(q),
    );
  }, [friends, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createGroupAndRedirect(name, Array.from(selected));
      if (result && "error" in result) setError(result.error);
    });
  }

  if (friends.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        You don&apos;t have anyone to add yet — groups need people you follow each other with.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="group-name">Group name (optional)</Label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekend crew"
          maxLength={60}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people you follow each other with"
          className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
        {filtered.map((f) => {
          const isSelected = selected.has(f.id);
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => toggle(f.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left hover:bg-surface-muted",
                isSelected ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <Avatar src={f.avatar_url} name={f.display_name ?? f.username} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {f.display_name || f.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{f.username}</p>
              </div>
              {isSelected && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={handleCreate}
        loading={pending}
        disabled={selected.size === 0}
        className="w-full"
      >
        Create group{selected.size > 0 ? ` (${selected.size + 1})` : ""}
      </Button>
    </div>
  );
}
