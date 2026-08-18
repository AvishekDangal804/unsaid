import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";
import { SafetyListItem } from "./safety-list-item";

export default async function SafetySettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/settings/safety");
  }

  const supabase = await createClient();
  const [{ data: blocks }, { data: mutes }] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
    supabase.from("mutes").select("muted_id").eq("muter_id", user.id),
  ]);

  const blockedIds = (blocks ?? []).map((b) => b.blocked_id);
  const mutedIds = (mutes ?? []).map((m) => m.muted_id);
  const allIds = Array.from(new Set([...blockedIds, ...mutedIds]));

  const { data: profiles } =
    allIds.length > 0
      ? await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", allIds)
      : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const blockedProfiles = blockedIds.map((id) => profileMap.get(id)).filter((p) => p != null);
  const mutedProfiles = mutedIds.map((id) => profileMap.get(id)).filter((p) => p != null);

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Safety</h1>
      <p className="mb-6 text-sm text-muted-foreground">Manage people you&apos;ve blocked or muted.</p>

      <h2 className="mb-2 text-sm font-medium text-foreground">Blocked ({blockedProfiles.length})</h2>
      {blockedProfiles.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">No one blocked.</p>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {blockedProfiles.map((p) => (
            <SafetyListItem key={p.id} person={p} kind="blocked" />
          ))}
        </div>
      )}

      <h2 className="mb-2 text-sm font-medium text-foreground">Muted ({mutedProfiles.length})</h2>
      {mutedProfiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one muted.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {mutedProfiles.map((p) => (
            <SafetyListItem key={p.id} person={p} kind="muted" />
          ))}
        </div>
      )}
    </div>
  );
}
