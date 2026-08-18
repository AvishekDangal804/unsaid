import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationItem } from "@/components/shared/notification-item";
import { NotificationsHeader } from "./notifications-header";
import { AutoMarkRead } from "./auto-mark-read";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  const items = await getNotifications(user.id);

  return (
    <div className="mx-auto w-full max-w-lg">
      <AutoMarkRead />
      <NotificationsHeader hasItems={items.length > 0} />

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          You&apos;re all caught up. New activity will show up here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <NotificationItem key={item.ids.join("-")} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
