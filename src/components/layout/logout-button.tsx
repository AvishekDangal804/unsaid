"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" loading={pending} onClick={handleLogout}>
      Log out
    </Button>
  );
}
