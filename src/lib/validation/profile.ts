import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be under 24 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores");

export const updateProfileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().max(50, "Keep it under 50 characters").optional(),
  bio: z.string().trim().max(160, "Keep it under 160 characters").optional(),
  isPrivate: z.boolean(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
