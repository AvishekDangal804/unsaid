"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <AlertTriangle className="size-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We hit a snag loading this. Try again, or head back home.
      </p>
      <div className="mt-2 flex gap-3">
        <Button size="sm" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/" className="flex items-center text-sm font-medium text-primary hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
