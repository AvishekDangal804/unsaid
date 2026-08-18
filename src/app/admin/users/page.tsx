import { createAdminClient } from "@/lib/supabase/admin";
import { UserRow } from "./user-row";

export const metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const params = await searchParams;
  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (qRaw ?? "").trim();

  const admin = createAdminClient();
  let usersQuery = admin
    .from("profiles")
    .select("id, username, status, is_restricted")
    .order("created_at", { ascending: false })
    .limit(30);

  if (query) {
    usersQuery = admin
      .from("profiles")
      .select("id, username, status, is_restricted")
      .ilike("username", `%${query}%`)
      .limit(30);
  }

  const { data: users } = await usersQuery;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Users</h1>

      <form className="mb-4" action="/admin/users">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search username..."
          className="h-10 w-full max-w-sm rounded-full border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      {!users || users.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <UserRow key={u.id} userId={u.id} username={u.username} status={u.status} isRestricted={u.is_restricted} />
          ))}
        </div>
      )}
    </div>
  );
}
