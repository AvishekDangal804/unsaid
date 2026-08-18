import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CreatePostMenu } from "@/components/shared/create-post-menu";
import { NotificationBell } from "./notification-bell";
import { MessagesLink } from "./messages-link";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Bookmark, Compass, Search, ShieldCheck } from "lucide-react";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { getUnreadMessageCount } from "@/lib/data/messages";
import { getStaffRole } from "@/lib/data/admin";
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
  let unreadCount = 0;
  let unreadMessages = 0;
  let isStaff = false;
  if (user && profile) {
    if (profile.is_private) {
      const supabase = await createClient();
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id)
        .eq("status", "pending");
      requestCount = count ?? 0;
    }
    const [unread, unreadMsgs, staffRole] = await Promise.all([
      getUnreadNotificationCount(user.id),
      getUnreadMessageCount(user.id),
      getStaffRole(user.id),
    ]);
    unreadCount = unread;
    unreadMessages = unreadMsgs;
    isStaff = Boolean(staffRole);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            UNSAID
          </Link>
          <Link
            href="/explore"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Explore
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted sm:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </Link>
          <Link
            href="/explore"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted sm:hidden"
            aria-label="Explore"
          >
            <Compass className="size-4" />
          </Link>
          <ThemeToggle />
          {user && profile ? (
            <>
              <div className="hidden sm:block">
                <CreatePostMenu />
              </div>
              <MessagesLink userId={user.id} initialUnread={unreadMessages > 0} />
              <div className="hidden sm:block">
                <NotificationBell userId={user.id} initialCount={unreadCount} />
              </div>
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
                className="hidden items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-surface-muted sm:flex"
              >
                <Avatar
                  src={profile.avatar_url}
                  name={profile.display_name ?? profile.username}
                  size={28}
                />
                <span className="text-sm text-foreground">@{profile.username}</span>
              </Link>
              {isStaff && (
                <Link
                  href="/admin"
                  className="hidden size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted sm:flex"
                  aria-label="Admin dashboard"
                >
                  <ShieldCheck className="size-4" />
                </Link>
              )}
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
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
