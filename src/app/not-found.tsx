import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <span className="text-2xl font-semibold tracking-tight text-foreground">UNSAID</span>
      <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page doesn&apos;t exist, or may have been removed.
      </p>
      <Link href="/" className={buttonVariants({ size: "sm", className: "mt-2" })}>
        Go home
      </Link>
    </div>
  );
}
