import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getConversation } from "@/lib/data/messages";
import { MessageThread } from "@/components/messages/message-thread";
import { ConversationMenu } from "./conversation-menu";

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/messages/${id}`);
  }

  const data = await getConversation(id, user.id);
  if (!data) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-2 flex justify-end">
        <ConversationMenu conversationId={id} />
      </div>
      <MessageThread
        conversationId={id}
        currentUserId={user.id}
        otherUser={data.otherUser}
        initialMessages={data.messages}
        initialStatus={data.conversation.status}
        isInitiator={data.isInitiator}
      />
    </div>
  );
}
