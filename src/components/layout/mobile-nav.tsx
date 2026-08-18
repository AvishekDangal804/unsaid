"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({ username }: { username: string }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/explore", label: "Explore", icon: Compass, active: pathname.startsWith("/explore") },
    { href: "/create", label: "Create", icon: PlusCircle, active: pathname.startsWith("/create") },
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
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
              item.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
