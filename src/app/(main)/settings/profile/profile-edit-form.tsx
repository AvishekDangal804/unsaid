"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/database.types";

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (result.username !== profile.username) {
        router.replace(`/${result.username}`);
      }
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          defaultValue={profile.username}
          required
        />
      </div>

      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={profile.display_name ?? ""}
          placeholder="What should people call you?"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">Bio</Label>
          <span className="text-xs text-muted-foreground">{bioLength}/160</span>
        </div>
        <textarea
          id="bio"
          name="bio"
          maxLength={160}
          rows={3}
          defaultValue={profile.bio ?? ""}
          onChange={(e) => setBioLength(e.target.value.length)}
          placeholder="A little about you"
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4">
        <input
          type="checkbox"
          name="isPrivate"
          defaultChecked={profile.is_private}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">Private account</span>
          <span className="block text-xs text-muted-foreground">
            New followers will need your approval before they can follow you.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-sm text-success">Your profile was saved.</p>
      )}

      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
