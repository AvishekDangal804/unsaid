"use client";

import { useState, useTransition } from "react";
import { votePoll } from "@/app/(main)/post-actions";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function PollDisplay({
  postId,
  options,
  initialMyVote,
  initialTotal,
  isLoggedIn,
}: {
  postId: string;
  options: { id: string; text: string; votes: number }[];
  initialMyVote: string | null;
  initialTotal: number;
  isLoggedIn: boolean;
}) {
  const [myVote, setMyVote] = useState(initialMyVote);
  const [optionVotes, setOptionVotes] = useState(
    Object.fromEntries(options.map((o) => [o.id, o.votes])),
  );
  const [pending, startTransition] = useTransition();

  const total = Object.values(optionVotes).reduce((sum, n) => sum + n, 0) || initialTotal;
  const hasVoted = Boolean(myVote);

  function handleVote(optionId: string) {
    if (!isLoggedIn || pending) return;

    const prevVote = myVote;
    const prevVotes = optionVotes;
    const nextVotes = { ...optionVotes };

    if (prevVote) nextVotes[prevVote] = Math.max(0, nextVotes[prevVote] - 1);
    nextVotes[optionId] = (nextVotes[optionId] ?? 0) + 1;
    setOptionVotes(nextVotes);
    setMyVote(optionId);

    startTransition(async () => {
      const result = await votePoll(postId, optionId);
      if ("error" in result) {
        setOptionVotes(prevVotes);
        setMyVote(prevVote);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const votes = optionVotes[option.id] ?? 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        const isMine = myVote === option.id;

        return (
          <button
            key={option.id}
            type="button"
            disabled={!isLoggedIn || pending}
            onClick={() => handleVote(option.id)}
            className={cn(
              "relative overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
              isMine ? "border-primary" : "border-border hover:bg-surface-muted",
              !isLoggedIn && "cursor-default",
            )}
          >
            {hasVoted && (
              <div
                className="absolute inset-y-0 left-0 bg-primary/10"
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            )}
            <div className="relative flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-foreground">
                {isMine && <Check className="size-4 text-primary" />}
                {option.text}
              </span>
              {hasVoted && (
                <span className="shrink-0 text-xs text-muted-foreground">{pct}%</span>
              )}
            </div>
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {total} {total === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
