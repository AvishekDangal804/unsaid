"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "./actions";
import { InstitutionPicker } from "./institution-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@/lib/countries";
import { EDUCATION_LEVELS, EDUCATION_LEVEL_LABELS } from "@/lib/validation/onboarding";
import type { EducationLevel } from "@/types/database.types";

export function OnboardingForm({
  initialCountry,
  initialEducationLevel,
  initialInstitutionId,
  initialInstitutionName,
  submitLabel = "Continue to UNSAID",
}: {
  initialCountry?: string;
  initialEducationLevel?: EducationLevel;
  initialInstitutionId?: string;
  initialInstitutionName?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [institutionChoice, setInstitutionChoice] = useState<{
    institutionId?: string;
    newInstitutionName?: string;
  }>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    if (institutionChoice.institutionId) {
      formData.set("institutionId", institutionChoice.institutionId);
    } else if (institutionChoice.newInstitutionName) {
      formData.set("newInstitutionName", institutionChoice.newInstitutionName);
    } else if (initialInstitutionId) {
      formData.set("institutionId", initialInstitutionId);
    }

    startTransition(async () => {
      const result = await completeOnboarding(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <Label htmlFor="country">Country</Label>
        <select
          id="country"
          name="country"
          required
          defaultValue={initialCountry ?? ""}
          className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Choose your country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="educationLevel">Education level</Label>
        <select
          id="educationLevel"
          name="educationLevel"
          required
          defaultValue={initialEducationLevel ?? ""}
          className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Choose your level
          </option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {EDUCATION_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>School / College / University</Label>
        <InstitutionPicker
          initialLabel={initialInstitutionName}
          onSelect={setInstitutionChoice}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Can&apos;t find yours? Type its name and add it — we&apos;ll review it.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={pending} className="mt-2 w-full">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
