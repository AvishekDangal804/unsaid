import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Logs" };

const ACTION_LABELS: Record<string, string> = {
  dismiss: "Dismissed report",
  remove_content: "Removed content",
  hide_content: "Hid content",
  warn: "Warned user",
  suspend: "Suspended user",
  ban: "Banned user",
  restrict: "Restricted user",
  unrestrict: "Removed restriction",
  unsuspend: "Lifted suspension",
  unban: "Unbanned user",
};

export default async function AdminLogsPage() {
  const admin = createAdminClient();
  const { data: actions } = await admin
    .from("moderation_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const moderatorIds = Array.from(
    new Set((actions ?? []).map((a) => a.moderator_id).filter((id): id is string => id !== null)),
  );
  const targetUserIds = Array.from(
    new Set((actions ?? []).filter((a) => a.target_type === "user").map((a) => a.target_id)),
  );
  const allIds = Array.from(new Set([...moderatorIds, ...targetUserIds]));

  const { data: profiles } =
    allIds.length > 0 ? await admin.from("profiles").select("id, username").in("id", allIds) : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Moderation log</h1>

      {!actions || actions.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No moderation actions yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{ACTION_LABELS[a.action] ?? a.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                by @{(a.moderator_id && profileMap.get(a.moderator_id)) ?? "a former staff member"}
                {a.target_type === "user" && ` · target @${profileMap.get(a.target_id) ?? "unknown"}`}
                {a.target_type !== "user" && ` · ${a.target_type} ${a.target_id.slice(0, 8)}`}
              </p>
              {a.reason && <p className="mt-1 text-xs italic text-muted-foreground">&quot;{a.reason}&quot;</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
