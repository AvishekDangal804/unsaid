import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getGroupConversation, getAddableFriends } from "@/lib/data/groups";
import { GroupMessageThread } from "@/components/messages/group-message-thread";

export default async function GroupConversationPage({ params }: PageProps<"/messages/group/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/messages/group/${id}`);
  }

  const data = await getGroupConversation(id, user.id);
  if (!data) {
    notFound();
  }

  const addableFriends = data.isOwner ? await getAddableFriends(user.id) : [];
  const memberIds = new Set(data.members.map((m) => m.id));
  const friendsNotInGroup = addableFriends.filter((f) => !memberIds.has(f.id));

  return (
    <div className="mx-auto w-full max-w-lg">
      <GroupMessageThread
        groupId={id}
        currentUserId={user.id}
        group={data.group}
        members={data.members}
        isOwner={data.isOwner}
        initialMessages={data.messages}
        addableFriends={friendsNotInGroup}
      />
    </div>
  );
}
