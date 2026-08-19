import { createClient } from "@/lib/supabase/server";

export type GroupSummary = {
  id: string;
  name: string | null;
  memberCount: number;
  otherMembers: { id: string; username: string; displayName: string | null; avatarUrl: string | null }[];
  lastMessageAt: string;
  lastMessagePreview: string | null;
};

export async function getMyGroups(userId: string): Promise<GroupSummary[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const [{ data: groups }, { data: allMembers }, { data: lastMessages }] = await Promise.all([
    supabase.from("group_conversations").select("*").in("id", groupIds),
    supabase.from("group_members").select("group_id, user_id").in("group_id", groupIds),
    supabase
      .from("group_messages")
      .select("group_id, content, created_at")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false }),
  ]);

  const memberIds = Array.from(new Set((allMembers ?? []).map((m) => m.user_id).filter((id) => id !== userId)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", memberIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const membersByGroup = new Map<string, string[]>();
  for (const m of allMembers ?? []) {
    const list = membersByGroup.get(m.group_id) ?? [];
    list.push(m.user_id);
    membersByGroup.set(m.group_id, list);
  }

  const previewByGroup = new Map<string, string>();
  for (const m of lastMessages ?? []) {
    if (!previewByGroup.has(m.group_id)) previewByGroup.set(m.group_id, m.content);
  }

  return (groups ?? [])
    .map((g) => {
      const memberIdsForGroup = membersByGroup.get(g.id) ?? [];
      const otherMembers = memberIdsForGroup
        .filter((id) => id !== userId)
        .map((id) => profileMap.get(id))
        .filter((p) => p !== undefined)
        .map((p) => ({ id: p.id, username: p.username, displayName: p.display_name, avatarUrl: p.avatar_url }));

      return {
        id: g.id,
        name: g.name,
        memberCount: memberIdsForGroup.length,
        otherMembers,
        lastMessageAt: g.last_message_at,
        lastMessagePreview: previewByGroup.get(g.id) ?? null,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export async function getGroupConversation(groupId: string, userId: string) {
  const supabase = await createClient();

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!myMembership) return null;

  const [{ data: group }, { data: members }, { data: messages }] = await Promise.all([
    supabase.from("group_conversations").select("*").eq("id", groupId).maybeSingle(),
    supabase.from("group_members").select("user_id, role").eq("group_id", groupId),
    supabase.from("group_messages").select("*").eq("group_id", groupId).order("created_at", { ascending: true }),
  ]);

  if (!group) return null;

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", memberIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const roleMap = new Map((members ?? []).map((m) => [m.user_id, m.role]));

  return {
    group,
    isOwner: myMembership.role === "owner",
    members: memberIds
      .map((id) => profileMap.get(id))
      .filter((p) => p !== undefined)
      .map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        role: roleMap.get(p.id) ?? "member",
      })),
    messages: messages ?? [],
  };
}

// People the current user can add to a group — mutual follows only,
// mirrors the trust check the create_group_conversation function
// enforces server-side.
export async function getAddableFriends(userId: string) {
  const supabase = await createClient();

  const [{ data: iFollow }, { data: followMe }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", userId).eq("status", "accepted"),
    supabase.from("follows").select("follower_id").eq("following_id", userId).eq("status", "accepted"),
  ]);

  const iFollowSet = new Set((iFollow ?? []).map((f) => f.following_id));
  const followMeSet = new Set((followMe ?? []).map((f) => f.follower_id));
  const mutualIds = [...iFollowSet].filter((id) => followMeSet.has(id));

  if (mutualIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", mutualIds)
    .order("username");

  return profiles ?? [];
}
