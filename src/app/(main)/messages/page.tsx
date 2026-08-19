import { redirect } from "next/navigation";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getConversations } from "@/lib/data/messages";
import { getMyGroups } from "@/lib/data/groups";
import { ConversationListItem } from "@/components/messages/conversation-list-item";
import { GroupListItem } from "@/components/messages/group-list-item";
import { buttonVariants } from "@/components/ui/button";

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/messages");
  }

  const [accepted, requests, groups] = await Promise.all([
    getConversations(user.id, "accepted"),
    getConversations(user.id, "pending"),
    getMyGroups(user.id),
  ]);

  const incomingRequests = requests.filter((r) => !r.isInitiator);

  type Row =
    | { kind: "conversation"; id: string; lastMessageAt: string; data: (typeof accepted)[number] }
    | { kind: "group"; id: string; lastMessageAt: string; data: (typeof groups)[number] };

  const rows: Row[] = [
    ...accepted.map((c) => ({ kind: "conversation" as const, id: c.id, lastMessageAt: c.lastMessageAt, data: c })),
    ...groups.map((g) => ({ kind: "group" as const, id: g.id, lastMessageAt: g.lastMessageAt, data: g })),
  ].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Messages</h1>
        <div className="flex items-center gap-3">
          {incomingRequests.length > 0 && (
            <Link href="/messages/requests" className="text-sm font-medium text-primary hover:underline">
              Requests ({incomingRequests.length})
            </Link>
          )}
          <Link
            href="/messages/new-group"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <UsersRound className="size-4" />
            New group
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No conversations yet. Visit a profile and tap Message to start one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) =>
            row.kind === "conversation" ? (
              <ConversationListItem key={row.id} conversation={row.data} />
            ) : (
              <GroupListItem key={row.id} group={row.data} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
