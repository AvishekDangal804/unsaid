"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Bell, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function MobileNav({
  userId,
  username,
  initialUnreadCount,
}: {
  userId: string;
  username: string;
  initialUnreadCount: number;
}) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`mobile-notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => setUnreadCount((c) => c + 1),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/explore", label: "Explore", icon: Compass, active: pathname.startsWith("/explore") },
    { href: "/create", label: "Create", icon: PlusCircle, active: pathname.startsWith("/create") },
    {
      href: "/notifications",
      label: "Alerts",
      icon: Bell,
      active: pathname.startsWith("/notifications"),
      badge: unreadCount,
      onClick: () => setUnreadCount(0),
    },
    {
      href: `/${username}`,
      label: "Profile",
      icon: User,
      active: pathname === `/${username}`,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur sm:hidden">
      <div className="flex h-16 items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={item.onClick}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
              item.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <item.icon className="size-5" />
              {!!item.badge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-medium text-primary-foreground">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
