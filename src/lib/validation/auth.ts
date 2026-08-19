import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be under 24 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export function isAtLeast13(dob: string) {
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 13;
}

export const signupSchema = z.object({
  email: z.email("Enter a valid email"),
  username: usernameSchema,
  password: passwordSchema,
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(isAtLeast13, "You must be at least 13 years old to join UNSAID"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const finishSignupSchema = z.object({
  username: usernameSchema,
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(isAtLeast13, "You must be at least 13 years old to join UNSAID"),
});
export type FinishSignupInput = z.infer<typeof finishSignupSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
