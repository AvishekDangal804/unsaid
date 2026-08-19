"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FacebookLoginButton } from "@/components/shared/facebook-login-button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirmation_failed"
      ? "That confirmation link is invalid or expired."
      : null,
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.replace(searchParams.get("next") ?? "/");
        router.refresh();
      }
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Welcome back</h1>
      <p className="mb-6 text-sm text-muted-foreground">Log in to continue.</p>

      <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <Label htmlFor="identifier">Email or username</Label>
          <Input id="identifier" name="identifier" type="text" autoComplete="username" required />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" loading={pending} className="mt-2 w-full">
          {pending ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <FacebookLoginButton />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to UNSAID?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
