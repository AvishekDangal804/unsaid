import Link from "next/link";
import { getAdminOverview, getPopularCategories } from "@/lib/data/admin-analytics";
import { StatTile } from "./stat-tile";

export default async function AdminOverviewPage() {
  const [overview, popularCategories] = await Promise.all([getAdminOverview(), getPopularCategories()]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Overview</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Total users" value={overview.totalUsers} />
        <StatTile label="New this week" value={overview.newUsersThisWeek} />
        <StatTile label="Posts" value={overview.totalPosts} />
        <StatTile label="Comments" value={overview.totalComments} />
        <StatTile label="Reactions" value={overview.totalReactions} />
        <StatTile label="Total reports" value={overview.totalReports} />
        <StatTile label="Suspended" value={overview.suspendedUsers} />
        <StatTile label="Banned" value={overview.bannedUsers} />
      </div>

      {overview.pendingReports > 0 && (
        <Link
          href="/admin/reports"
          className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10"
        >
          {overview.pendingReports} pending report{overview.pendingReports === 1 ? "" : "s"} need review
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {popularCategories.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Popular categories</h2>
          <div className="flex flex-wrap gap-2">
            {popularCategories.map((c) => (
              <span
                key={c.label}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
              >
                {c.label} <span className="text-muted-foreground">({c.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
