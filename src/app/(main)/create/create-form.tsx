"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "./actions";
import { PostMediaUploader } from "@/components/shared/post-media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import type { Category, PostType } from "@/types/database.types";
import { Plus, X } from "lucide-react";

const TYPE_META: Record<PostType, { label: string; emoji: string; placeholder: string }> = {
  post: { label: "Post", emoji: "📝", placeholder: "What's on your mind?" },
  photo: { label: "Photo", emoji: "📸", placeholder: "Write a caption..." },
  confession: { label: "Confession", emoji: "❤️", placeholder: "Share anonymously or as yourself..." },
  story: { label: "Story", emoji: "📖", placeholder: "Tell your story..." },
  poll: { label: "Poll", emoji: "🗳️", placeholder: "Ask a question..." },
  question: { label: "Question", emoji: "❓", placeholder: "What do you want to ask?" },
};

export function CreateForm({
  initialType,
  categories,
  userId,
  community,
  dailyQuestion,
}: {
  initialType: PostType;
  categories: Category[];
  userId: string;
  community?: { id: string; name: string; slug: string } | null;
  dailyQuestion?: { id: string; question_text: string } | null;
}) {
  const router = useRouter();
  const [type, setType] = useState<PostType>(initialType);
  const [content, setContent] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const meta = TYPE_META[type];

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    if (community) formData.set("communityId", community.id);
    if (dailyQuestion) formData.set("dailyQuestionId", dailyQuestion.id);
    mediaUrls.forEach((url) => formData.append("mediaUrls", url));
    if (type === "poll") {
      pollOptions.filter((o) => o.trim()).forEach((o) => formData.append("pollOptions", o));
    }

    startTransition(async () => {
      const result = await createPost(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
      {community && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          Posting in <strong>{community.name}</strong>
        </div>
      )}

      {dailyQuestion && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          Answering: <strong>{dailyQuestion.question_text}</strong>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_META) as PostType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              type === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-surface-muted"
            }`}
          >
            <span>{TYPE_META[t].emoji}</span>
            {TYPE_META[t].label}
          </button>
        ))}
      </div>

      <div>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={type === "story" ? 8 : 4}
          placeholder={meta.placeholder}
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {(type === "photo" || type === "post") && (
        <PostMediaUploader userId={userId} onChangeAction={setMediaUrls} />
      )}

      {type === "poll" && (
        <div className="flex flex-col gap-2">
          {pollOptions.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => {
                  const next = [...pollOptions];
                  next[i] = e.target.value;
                  setPollOptions(next);
                }}
                placeholder={`Option ${i + 1}`}
                maxLength={80}
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-danger"
                  aria-label="Remove option"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button
              type="button"
              onClick={() => setPollOptions([...pollOptions, ""])}
              className="flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
            >
              <Plus className="size-4" /> Add option
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue=""
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="mood">Mood</Label>
          <select
            id="mood"
            name="mood"
            defaultValue=""
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">None</option>
            {MOOD_ORDER.map((m) => (
              <option key={m} value={m}>
                {MOOD_META[m].emoji} {MOOD_META[m].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isAnonymous" className="size-4 accent-primary" />
        Post anonymously
      </label>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="commentsEnabled" defaultChecked className="size-4 accent-primary" />
        Allow comments
      </label>

      {showContentWarning ? (
        <div>
          <Label htmlFor="contentWarning">Content warning</Label>
          <Input id="contentWarning" name="contentWarning" maxLength={80} placeholder="e.g. Mentions of loss" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowContentWarning(true)}
          className="self-start text-sm font-medium text-primary hover:underline"
        >
          + Add a content warning
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Posting..." : "Post"}
      </Button>
    </form>
  );
}
