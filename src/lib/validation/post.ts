import { z } from "zod";

export const POST_TYPES = ["post", "confession", "story", "question", "poll", "photo"] as const;
export const MAX_POST_IMAGES = 4;
export const MOODS = [
  "love",
  "heartbroken",
  "sad",
  "funny",
  "angry",
  "support",
  "calm",
  "motivated",
  "confused",
  "happy",
] as const;
export const REACTION_TYPES = ["love", "hug", "funny", "relatable", "angry", "fire"] as const;
export const REPORT_REASONS = [
  "harassment",
  "bullying",
  "spam",
  "threat",
  "hate",
  "personal_information",
  "impersonation",
  "sexual_content",
  "dangerous_content",
  "other",
] as const;
export const REPORT_TARGET_TYPES = ["post", "comment", "user", "message", "community"] as const;

const CONTENT_LIMITS: Record<(typeof POST_TYPES)[number], number> = {
  post: 2000,
  confession: 1000,
  story: 5000,
  question: 280,
  poll: 200,
  photo: 500,
};

export const createPostSchema = z
  .object({
    type: z.enum(POST_TYPES),
    content: z.string().trim().max(5000).optional(),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    mood: z.enum(MOODS).optional().or(z.literal("")),
    isAnonymous: z.boolean(),
    commentsEnabled: z.boolean(),
    contentWarning: z.string().trim().max(80).optional(),
    pollOptions: z.array(z.string().trim().min(1).max(80)).min(2).max(6).optional(),
    mediaUrls: z.array(z.string().url()).max(MAX_POST_IMAGES).optional(),
  })
  .superRefine((data, ctx) => {
    const limit = CONTENT_LIMITS[data.type];
    const hasMedia = !!data.mediaUrls && data.mediaUrls.length > 0;
    const hasContent = !!data.content && data.content.length > 0;

    if (data.type === "poll") {
      if (!hasContent) {
        ctx.addIssue({ code: "custom", path: ["content"], message: "Give your poll a question" });
      }
      if (!data.pollOptions || data.pollOptions.length < 2) {
        ctx.addIssue({ code: "custom", path: ["pollOptions"], message: "Add at least 2 options" });
      }
    } else if (data.type === "photo") {
      if (!hasMedia) {
        ctx.addIssue({ code: "custom", path: ["mediaUrls"], message: "Add a photo" });
      }
    } else if (data.type === "post") {
      if (!hasContent && !hasMedia) {
        ctx.addIssue({ code: "custom", path: ["content"], message: "Say something or add a photo" });
      }
    } else if (!hasContent) {
      ctx.addIssue({ code: "custom", path: ["content"], message: "Say something first" });
    }

    if (data.content && data.content.length > limit) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: `Keep it under ${limit} characters`,
      });
    }
  });
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().trim().min(1, "Say something first").max(1000, "Keep it under 1000 characters"),
  isAnonymous: z.boolean(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(500).optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const MAX_POST_MEDIA_BYTES = 8 * 1024 * 1024;
export const ALLOWED_POST_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];
