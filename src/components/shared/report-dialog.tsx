"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { submitReport } from "@/app/(main)/post-actions";
import { Button } from "@/components/ui/button";
import type { ReportReason, ReportTargetType } from "@/types/database.types";

const REASON_LABELS: Record<ReportReason, string> = {
  harassment: "Harassment",
  bullying: "Bullying",
  spam: "Spam",
  threat: "Threat",
  hate: "Hate speech",
  personal_information: "Shares personal information",
  impersonation: "Impersonation",
  sexual_content: "Sexual content",
  dangerous_content: "Dangerous content",
  other: "Other",
};

export function ReportDialog({
  targetType,
  targetId,
  onCloseAction,
}: {
  targetType: ReportTargetType;
  targetId: string;
  onCloseAction: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason) return;
    setError(null);
    const formData = new FormData();
    formData.set("targetType", targetType);
    formData.set("targetId", targetId);
    formData.set("reason", reason);
    formData.set("details", details);

    startTransition(async () => {
      const result = await submitReport(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl border border-border bg-surface p-5 shadow-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            {submitted ? "Report sent" : "Report"}
          </h2>
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-full p-1 text-muted-foreground hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thanks for letting us know. Our team will review this.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-1.5">
              {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm ${
                    reason === r ? "border-primary text-primary" : "border-border text-foreground hover:bg-surface-muted"
                  }`}
                >
                  {REASON_LABELS[r]}
                </button>
              ))}
            </div>

            {reason === "other" && (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell us more (optional)"
                className="mb-4 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}

            {error && (
              <p role="alert" className="mb-3 text-sm text-danger">
                {error}
              </p>
            )}

            <Button
              type="button"
              variant="danger"
              className="w-full"
              disabled={!reason}
              loading={pending}
              onClick={handleSubmit}
            >
              Submit report
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
