import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getConversations } from "@/lib/data/messages";
import { MessageRequestItem } from "./request-item";

export default async function MessageRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/messages/requests");
  }

  const pending = await getConversations(user.id, "pending");
  const incoming = pending.filter((r) => !r.isInitiator);

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Message requests</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        From people you don&apos;t follow yet.
      </p>

      {incoming.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No pending requests.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {incoming.map((c) => (
            <MessageRequestItem key={c.id} conversation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
