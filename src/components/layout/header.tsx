import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CreatePostMenu } from "@/components/shared/create-post-menu";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { LogoutButton } from "./logout-button";

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <span className="text-lg font-semibold tracking-tight text-foreground">UNSAID</span>
        <div className="size-9" />
      </div>
    </header>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  const profile = user ? await getProfileById(user.id) : null;

  let requestCount = 0;
  if (user && profile?.is_private) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id)
      .eq("status", "pending");
    requestCount = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          UNSAID
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && profile ? (
            <>
              <CreatePostMenu />
              <Link
                href="/saved"
                className="hidden size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted sm:flex"
                aria-label="Saved posts"
              >
                <Bookmark className="size-4" />
              </Link>
              {requestCount > 0 && (
                <Link
                  href="/requests"
                  className="hidden text-sm font-medium text-primary hover:underline sm:inline"
                >
                  Requests ({requestCount})
                </Link>
              )}
              <Link
                href={`/${profile.username}`}
                className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-surface-muted"
              >
                <Avatar
                  src={profile.avatar_url}
                  name={profile.display_name ?? profile.username}
                  size={28}
                />
                <span className="hidden text-sm text-foreground sm:inline">
                  @{profile.username}
                </span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
