"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

export type ActionResult = { error: string } | { success: true };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function startConversation(targetId: string): Promise<ActionResult & { conversationId?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { data: conversationId, error } = await supabase.rpc("get_or_create_conversation", {
    p_other_user_id: targetId,
  });

  if (error || !conversationId) {
    return { error: error?.message.includes("not accepting") || error?.message.includes("only accepts")
      ? "This person isn't accepting messages right now."
      : error?.message.includes("not available")
        ? "You can't message this person."
        : "Something went wrong. Try again." };
  }

  return { success: true, conversationId };
}

export async function startConversationAndRedirect(targetId: string) {
  const result = await startConversation(targetId);
  if ("conversationId" in result && result.conversationId) {
    redirect(`/messages/${result.conversationId}`);
  }
  return result;
}

export async function sendMessage(conversationId: string, content: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Type something first" };
  if (trimmed.length > 2000) return { error: "Keep it under 2000 characters" };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("user_one_id, user_two_id, initiator_id, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation not found" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: trimmed,
  });

  if (error) return { error: "Message couldn't be sent. You may have been blocked." };

  // Replying to a pending request implicitly accepts it.
  if (conversation.status === "pending" && conversation.initiator_id !== user.id) {
    await supabase.from("conversations").update({ status: "accepted" }).eq("id", conversationId);
  }

  const recipientId = conversation.user_one_id === user.id ? conversation.user_two_id : conversation.user_one_id;
  await notify(supabase, {
    recipientId,
    type: "message",
    targetType: "conversation",
    targetId: conversationId,
  });

  revalidatePath(`/messages/${conversationId}`);
  return { success: true };
}

export async function acceptConversation(conversationId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("conversations")
    .update({ status: "accepted" })
    .eq("id", conversationId)
    .neq("initiator_id", user.id);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/messages");
  return { success: true };
}

export async function declineConversation(conversationId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("conversations")
    .update({ status: "declined" })
    .eq("id", conversationId)
    .neq("initiator_id", user.id);

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/messages");
  return { success: true };
}

export async function deleteConversationForMe(conversationId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("conversation_deletions")
    .upsert({ conversation_id: conversationId, user_id: user.id });

  if (error) return { error: "Something went wrong. Try again." };
  revalidatePath("/messages");
  return { success: true };
}

export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("conversation_reads")
    .upsert({ conversation_id: conversationId, user_id: user.id, last_read_at: new Date().toISOString() });

  if (error) return { error: "Something went wrong. Try again." };
  return { success: true };
}
