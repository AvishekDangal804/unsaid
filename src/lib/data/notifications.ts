import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationType, NotificationTargetType } from "@/types/database.types";

export type NotificationActor = {
  id: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type NotificationItem = {
  ids: string[];
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  message: string | null;
  actors: NotificationActor[];
  extraCount: number;
};

const GROUPABLE_TYPES: NotificationType[] = ["reaction_post", "reaction_comment"];

export async function getNotifications(userId: string, limit = 50): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows || rows.length === 0) return [];

  const actorIds = Array.from(
    new Set(rows.filter((r) => r.actor_id && !r.is_anonymous_actor).map((r) => r.actor_id as string)),
  );

  const { data: profiles } =
    actorIds.length > 0
      ? await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", actorIds)
      : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  function actorFor(row: Notification): NotificationActor {
    if (!row.actor_id || row.is_anonymous_actor) {
      return { id: null, username: null, displayName: null, avatarUrl: null };
    }
    const profile = profileMap.get(row.actor_id);
    return {
      id: row.actor_id,
      username: profile?.username ?? null,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  }

  const items: NotificationItem[] = [];
  const groupIndexByKey = new Map<string, number>();

  for (const row of rows) {
    const isGroupable = GROUPABLE_TYPES.includes(row.type);
    const key = `${row.type}:${row.target_type}:${row.target_id}`;

    if (isGroupable && groupIndexByKey.has(key)) {
      const existing = items[groupIndexByKey.get(key)!];
      existing.ids.push(row.id);
      if (!row.read_at) existing.isRead = false;
      if (existing.actors.length < 3) {
        existing.actors.push(actorFor(row));
      } else {
        existing.extraCount += 1;
      }
      continue;
    }

    const item: NotificationItem = {
      ids: [row.id],
      type: row.type,
      isRead: Boolean(row.read_at),
      createdAt: row.created_at,
      targetType: row.target_type,
      targetId: row.target_id,
      message: row.message,
      actors: [actorFor(row)],
      extraCount: 0,
    };
    items.push(item);
    if (isGroupable) groupIndexByKey.set(key, items.length - 1);
  }

  return items;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
