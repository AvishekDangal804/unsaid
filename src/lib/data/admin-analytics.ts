import { createAdminClient } from "@/lib/supabase/admin";

export async function getAdminOverview() {
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsers,
    newUsersThisWeek,
    totalPosts,
    totalComments,
    totalReactions,
    pendingReports,
    totalReports,
    bannedUsers,
    suspendedUsers,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    admin.from("posts").select("*", { count: "exact", head: true }),
    admin.from("comments").select("*", { count: "exact", head: true }),
    admin.from("reactions").select("*", { count: "exact", head: true }),
    admin.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("reports").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("status", "banned"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("status", "suspended"),
  ]);

  return {
    totalUsers: totalUsers.count ?? 0,
    newUsersThisWeek: newUsersThisWeek.count ?? 0,
    totalPosts: totalPosts.count ?? 0,
    totalComments: totalComments.count ?? 0,
    totalReactions: totalReactions.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
    totalReports: totalReports.count ?? 0,
    bannedUsers: bannedUsers.count ?? 0,
    suspendedUsers: suspendedUsers.count ?? 0,
  };
}

export async function getPopularCategories(limit = 5) {
  const admin = createAdminClient();
  const { data: posts } = await admin.from("posts").select("category_id").not("category_id", "is", null);
  if (!posts || posts.length === 0) return [];

  const countByCategory = new Map<string, number>();
  for (const p of posts) {
    if (!p.category_id) continue;
    countByCategory.set(p.category_id, (countByCategory.get(p.category_id) ?? 0) + 1);
  }

  const topIds = Array.from(countByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const { data: categories } = await admin.from("categories").select("id, label").in("id", topIds);

  return topIds
    .map((id) => {
      const cat = categories?.find((c) => c.id === id);
      return cat ? { label: cat.label, count: countByCategory.get(id) ?? 0 } : null;
    })
    .filter((x): x is { label: string; count: number } => x !== null);
}
