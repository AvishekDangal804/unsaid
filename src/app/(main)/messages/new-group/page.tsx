import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getAddableFriends } from "@/lib/data/groups";
import { NewGroupForm } from "./new-group-form";

export const metadata = { title: "New group" };

export default async function NewGroupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages/new-group");

  const friends = await getAddableFriends(user.id);

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-foreground">New group</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        You can only add people you follow each other with.
      </p>
      <NewGroupForm friends={friends} />
    </div>
  );
}
