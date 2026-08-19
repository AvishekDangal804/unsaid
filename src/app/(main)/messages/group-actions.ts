"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";
import type { ActionResult } from "./actions";
import type { GroupMessage } from "@/types/database.types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function friendlyGroupError(message: string): string {
  if (message.includes("can't be added") || message.includes("follow each other")) {
    return "You can only add people you follow each other with, and no one you've blocked.";
  }
  if (message.includes("at least one other member")) {
    return "Pick at least one person to add.";
  }
  if (message.includes("limited to 50")) {
    return "Groups can have at most 50 members.";
  }
  return "Something went wrong creating the group.";
}

export async function createGroup(
  name: string,
  memberIds: string[],
): Promise<ActionResult & { groupId?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  if (memberIds.length === 0) return { error: "Pick at least one person to add." };

  const { data: groupId, error } = await supabase.rpc("create_group_conversation", {
    p_name: name.trim() || null,
    p_member_ids: memberIds,
  });

  if (error || !groupId) return { error: friendlyGroupError(error?.message ?? "") };

  for (const memberId of memberIds) {
    await notify(supabase, {
      recipientId: memberId,
      type: "message",
      targetType: "group_conversation",
      targetId: groupId,
    });
  }

  return { success: true, groupId };
}

export async function createGroupAndRedirect(name: string, memberIds: string[]) {
  const result = await createGroup(name, memberIds);
  if ("groupId" in result && result.groupId) {
    redirect(`/messages/group/${result.groupId}`);
  }
  return result;
}

export async function addGroupMember(groupId: string, userId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.rpc("add_group_member", {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) {
    return {
      error: error.message.includes("only the group creator")
        ? "Only the group creator can add members."
        : friendlyGroupError(error.message),
    };
  }

  await notify(supabase, {
    recipientId: userId,
    type: "message",
    targetType: "conversation",
    targetId: groupId,
  });

  revalidatePath(`/messages/group/${groupId}`);
  return { success: true };
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) return { error: "Couldn't leave the group. Try again." };

  revalidatePath("/messages");
  return { success: true };
}

export async function sendGroupMessage(
  groupId: string,
  content: string,
): Promise<ActionResult & { message?: GroupMessage }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to log in first" };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Type something first" };
  if (trimmed.length > 2000) return { error: "Keep it under 2000 characters" };

  const { data: message, error } = await supabase
    .from("group_messages")
    .insert({ group_id: groupId, sender_id: user.id, content: trimmed })
    .select()
    .single();

  if (error || !message) return { error: "Message couldn't be sent." };

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .neq("user_id", user.id);

  for (const member of members ?? []) {
    await notify(supabase, {
      recipientId: member.user_id,
      type: "message",
      targetType: "group_conversation",
      targetId: groupId,
    });
  }

  revalidatePath(`/messages/group/${groupId}`);
  return { success: true, message };
}
