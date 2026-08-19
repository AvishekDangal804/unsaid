"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeFinishSignup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FinishSignupForm({ suggestedUsername }: { suggestedUsername: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await completeFinishSignup(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.replace("/");
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <Label htmlFor="username">Choose a username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          defaultValue={suggestedUsername}
          placeholder="e.g. quiet_soul"
          required
        />
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        <p className="mt-1 text-xs text-muted-foreground">
          We use this to keep UNSAID safe. It&apos;s never shown on your profile.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={pending} className="mt-2 w-full">
        {pending ? "Saving..." : "Continue to UNSAID"}
      </Button>
    </form>
  );
}
