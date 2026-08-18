"use client";

import { useState, useTransition } from "react";
import { createComment } from "@/app/(main)/post-actions";
import { Button } from "@/components/ui/button";

export function CommentForm({
  postId,
  parentId,
  onPostedAction,
  autoFocus,
}: {
  postId: string;
  parentId?: string;
  onPostedAction?: () => void;
  autoFocus?: boolean;
}) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.set("postId", postId);
    if (parentId) formData.set("parentId", parentId);
    formData.set("content", content);
    if (isAnonymous) formData.set("isAnonymous", "on");

    startTransition(async () => {
      const result = await createComment(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setContent("");
      onPostedAction?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus={autoFocus}
        rows={2}
        maxLength={1000}
        placeholder={parentId ? "Write a reply..." : "Add a comment..."}
        className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="size-3.5 accent-primary"
          />
          Anonymous
        </label>
        <Button type="submit" size="sm" loading={pending} disabled={!content.trim()}>
          {parentId ? "Reply" : "Comment"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
