import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getConversations } from "@/lib/data/messages";
import { ConversationListItem } from "@/components/messages/conversation-list-item";

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/messages");
  }

  const [accepted, requests] = await Promise.all([
    getConversations(user.id, "accepted"),
    getConversations(user.id, "pending"),
  ]);

  const incomingRequests = requests.filter((r) => !r.isInitiator);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Messages</h1>
        {incomingRequests.length > 0 && (
          <Link href="/messages/requests" className="text-sm font-medium text-primary hover:underline">
            Requests ({incomingRequests.length})
          </Link>
        )}
      </div>

      {accepted.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No conversations yet. Visit a profile and tap Message to start one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {accepted.map((c) => (
            <ConversationListItem key={c.id} conversation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
