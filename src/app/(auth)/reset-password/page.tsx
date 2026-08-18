"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await resetPassword(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.replace("/login");
      }
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Set a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose a new password for your account.
      </p>

      <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" loading={pending} className="mt-2 w-full">
          {pending ? "Saving..." : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
