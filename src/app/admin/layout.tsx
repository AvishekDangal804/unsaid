import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getStaffRole } from "@/lib/data/admin";

export const metadata = { title: { default: "Admin", template: "%s · Admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  // Server-side role check against a database-backed table — never a
  // frontend-only gate, never an email allowlist.
  const role = await getStaffRole(user.id);
  if (!role) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold text-foreground">
              UNSAID Admin
            </Link>
            <nav className="hidden gap-4 sm:flex">
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                Overview
              </Link>
              <Link href="/admin/reports" className="text-sm text-muted-foreground hover:text-foreground">
                Reports
              </Link>
              <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
                Users
              </Link>
              <Link href="/admin/logs" className="text-sm text-muted-foreground hover:text-foreground">
                Logs
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
