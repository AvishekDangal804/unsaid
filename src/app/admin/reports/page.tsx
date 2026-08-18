import { getPendingReports } from "@/lib/data/reports";
import { ReportCard } from "./report-card";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const reports = await getPendingReports();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Moderation queue</h1>
      {reports.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No pending reports.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
