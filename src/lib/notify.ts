import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types/database.types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function notify(
  supabase: SupabaseServerClient,
  params: {
    recipientId: string;
    type: NotificationType;
    targetType?: "post" | "comment" | "profile";
    targetId?: string;
    isAnonymousActor?: boolean;
  },
) {
  await supabase.rpc("create_notification", {
    p_recipient_id: params.recipientId,
    p_type: params.type,
    p_target_type: params.targetType ?? null,
    p_target_id: params.targetId ?? null,
    p_is_anonymous_actor: params.isAnonymousActor ?? false,
  });
}
