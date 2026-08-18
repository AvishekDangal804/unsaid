import { createClient } from "@/lib/supabase/server";
import type { ConversationStatus } from "@/types/database.types";

export type ConversationSummary = {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  status: ConversationStatus;
  isInitiator: boolean;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
};

function otherParticipantId(
  conversation: { user_one_id: string; user_two_id: string },
  userId: string,
) {
  return conversation.user_one_id === userId ? conversation.user_two_id : conversation.user_one_id;
}

export async function getConversations(
  userId: string,
  status: ConversationStatus,
): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  const [{ data: asOne }, { data: asTwo }, { data: deletions }] = await Promise.all([
    supabase.from("conversations").select("*").eq("user_one_id", userId).eq("status", status),
    supabase.from("conversations").select("*").eq("user_two_id", userId).eq("status", status),
    supabase.from("conversation_deletions").select("conversation_id, deleted_at").eq("user_id", userId),
  ]);

  const all = [...(asOne ?? []), ...(asTwo ?? [])].sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
  );

  const deletionMap = new Map((deletions ?? []).map((d) => [d.conversation_id, d.deleted_at]));
  const visible = all.filter((c) => {
    const deletedAt = deletionMap.get(c.id);
    return !deletedAt || new Date(c.last_message_at) > new Date(deletedAt);
  });

  if (visible.length === 0) return [];

  const otherIds = visible.map((c) => otherParticipantId(c, userId));
  const conversationIds = visible.map((c) => c.id);

  const [{ data: profiles }, { data: lastMessages }, { data: reads }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", otherIds),
    supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    supabase.from("conversation_reads").select("*").eq("user_id", userId).in("conversation_id", conversationIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const readMap = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]));

  const previewByConversation = new Map<string, string>();
  for (const m of lastMessages ?? []) {
    if (!previewByConversation.has(m.conversation_id)) {
      previewByConversation.set(m.conversation_id, m.content);
    }
  }

  const unreadCounts = new Map<string, number>();
  for (const m of lastMessages ?? []) {
    const lastRead = readMap.get(m.conversation_id);
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
      unreadCounts.set(m.conversation_id, (unreadCounts.get(m.conversation_id) ?? 0) + 1);
    }
  }

  return visible
    .map((c) => {
      const otherId = otherParticipantId(c, userId);
      const profile = profileMap.get(otherId);
      if (!profile) return null;
      return {
        id: c.id,
        otherUser: {
          id: otherId,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        },
        status: c.status,
        isInitiator: c.initiator_id === userId,
        lastMessageAt: c.last_message_at,
        lastMessagePreview: previewByConversation.get(c.id) ?? null,
        unreadCount: unreadCounts.get(c.id) ?? 0,
      };
    })
    .filter((c): c is ConversationSummary => c !== null);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const conversations = await getConversations(userId, "accepted");
  return conversations.reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0);
}

export async function getConversation(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || (conversation.user_one_id !== userId && conversation.user_two_id !== userId)) {
    return null;
  }

  const otherId = otherParticipantId(conversation, userId);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", otherId)
    .maybeSingle();

  if (!profile) return null;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return {
    conversation,
    otherUser: profile,
    messages: messages ?? [],
    isInitiator: conversation.initiator_id === userId,
  };
}
