"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { performModeration } from "../moderation-actions";
import { Button } from "@/components/ui/button";
import type { ReportWithContext } from "@/lib/data/reports";

const REASON_LABELS: Record<string, string> = {
  harassment: "Harassment",
  bullying: "Bullying",
  spam: "Spam",
  threat: "Threat",
  hate: "Hate speech",
  personal_information: "Personal information",
  impersonation: "Impersonation",
  sexual_content: "Sexual content",
  dangerous_content: "Dangerous content",
  other: "Other",
};

export function ReportCard({ report }: { report: ReportWithContext }) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { preview } = report;

  function act(
    action: Parameters<typeof performModeration>[0]["action"],
    targetType: Parameters<typeof performModeration>[0]["targetType"],
    targetId: string,
    label: string,
  ) {
    startTransition(async () => {
      const result = await performModeration({ action, targetType, targetId, reportId: report.id });
      if (!("error" in result)) setResolved(label);
    });
  }

  if (resolved) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
        Resolved: {resolved}
      </div>
    );
  }

  const contentLink =
    report.targetType === "post"
      ? `/post/${report.targetId}`
      : report.targetType === "user" && preview.authorUsername
        ? `/${preview.authorUsername}`
        : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Reported by {report.reporterUsername ? `@${report.reporterUsername}` : "someone"} ·{" "}
          {REASON_LABELS[report.reason] ?? report.reason}
        </span>
        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
      </div>

      {report.details && <p className="mb-2 text-xs italic text-muted-foreground">&quot;{report.details}&quot;</p>}

      <div className="mb-3 rounded-lg bg-surface-muted p-3">
        {preview.authorUsername && (
          <p className="mb-1 text-xs font-medium text-foreground">@{preview.authorUsername}</p>
        )}
        <p className="whitespace-pre-wrap text-sm text-foreground">{preview.text}</p>
        {preview.isHidden && <p className="mt-1 text-xs text-primary">Already hidden</p>}
        {contentLink && (
          <Link href={contentLink} className="mt-1 inline-block text-xs text-primary hover:underline">
            View
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" loading={pending} onClick={() => act("dismiss", report.targetType, report.targetId, "Dismissed")}>
          Dismiss
        </Button>

        {(report.targetType === "post" || report.targetType === "comment") && (
          <>
            <Button
              size="sm"
              variant="outline"
              loading={pending}
              onClick={() => act("hide_content", report.targetType as "post" | "comment", report.targetId, "Content hidden")}
            >
              Hide content
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={pending}
              onClick={() => act("remove_content", report.targetType as "post" | "comment", report.targetId, "Content removed")}
            >
              Remove content
            </Button>
          </>
        )}

        {preview.authorId && (
          <>
            <Button size="sm" variant="outline" loading={pending} onClick={() => act("warn", "user", preview.authorId!, "User warned")}>
              Warn author
            </Button>
            <Button size="sm" variant="outline" loading={pending} onClick={() => act("suspend", "user", preview.authorId!, "User suspended")}>
              Suspend author
            </Button>
            <Button size="sm" variant="danger" loading={pending} onClick={() => act("ban", "user", preview.authorId!, "User banned")}>
              Ban author
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
