import { z } from "zod";
import { COUNTRIES } from "@/lib/countries";

export const EDUCATION_LEVELS = ["school", "plus_two", "bachelor", "master", "other"] as const;

export const EDUCATION_LEVEL_LABELS: Record<(typeof EDUCATION_LEVELS)[number], string> = {
  school: "School",
  plus_two: "+2 / High school",
  bachelor: "Bachelor's",
  master: "Master's",
  other: "Other",
};

export const onboardingSchema = z.object({
  country: z.enum(COUNTRIES, { message: "Choose your country" }),
  educationLevel: z.enum(EDUCATION_LEVELS, { message: "Choose your education level" }),
  institutionId: z.string().uuid().optional(),
  newInstitutionName: z.string().trim().min(2).max(120).optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
