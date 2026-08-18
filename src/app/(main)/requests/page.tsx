import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { RequestItem } from "./request-item";

export default async function FollowRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/requests");
  }

  const supabase = await createClient();

  const { data: pendingFollows } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const followerIds = pendingFollows?.map((f) => f.follower_id) ?? [];

  const { data: profiles } =
    followerIds.length > 0
      ? await supabase.from("profiles").select("*").in("id", followerIds)
      : { data: [] };

  const requests = (pendingFollows ?? [])
    .map((f) => ({
      follow: f,
      profile: profiles?.find((p) => p.id === f.follower_id),
    }))
    .filter((r) => r.profile);

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Follow requests</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        People who want to follow your private account.
      </p>

      {requests.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No pending requests right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map(({ profile }) => (
            <li key={profile!.id}>
              <RequestItem profile={profile!} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
