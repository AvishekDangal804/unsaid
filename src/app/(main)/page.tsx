import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
        <h1 className="text-xl font-semibold text-foreground">You&apos;re all caught up.</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your feed is coming soon — this is where confessions, stories, and thoughts from
          people you follow will show up.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Every feeling has a story.
        </h1>
        <p className="mx-auto max-w-md text-base text-muted-foreground">
          Share instant thoughts, confessions, and stories — with your name, or anonymously.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Get started
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Log in
        </Link>
      </div>
    </div>
  );
}
