import { createAdminClient } from "@/lib/supabase/admin";
import type { ReportReason, ReportTargetType } from "@/types/database.types";

export type ReportWithContext = {
  id: string;
  reporterUsername: string | null;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  createdAt: string;
  preview: {
    kind: "post" | "comment" | "user" | "unavailable";
    text: string;
    authorId: string | null;
    authorUsername: string | null;
    isHidden?: boolean;
  };
};

export async function getPendingReports(): Promise<ReportWithContext[]> {
  const admin = createAdminClient();
  const { data: reports } = await admin
    .from("reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!reports || reports.length === 0) return [];

  const reporterIds = Array.from(new Set(reports.map((r) => r.reporter_id)));
  const { data: reporters } = await admin.from("profiles").select("id, username").in("id", reporterIds);
  const reporterMap = new Map((reporters ?? []).map((r) => [r.id, r.username]));

  const postIds = reports.filter((r) => r.target_type === "post").map((r) => r.target_id);
  const commentIds = reports.filter((r) => r.target_type === "comment").map((r) => r.target_id);
  const userIds = reports.filter((r) => r.target_type === "user").map((r) => r.target_id);

  const [postsResult, commentsResult, usersResult] = await Promise.all([
    postIds.length > 0 ? admin.from("posts").select("id, content, author_id, is_hidden").in("id", postIds) : Promise.resolve({ data: [] }),
    commentIds.length > 0
      ? admin.from("comments").select("id, content, author_id, is_hidden").in("id", commentIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0 ? admin.from("profiles").select("id, username").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);

  const authorIds = Array.from(
    new Set([...(postsResult.data ?? []).map((p) => p.author_id), ...(commentsResult.data ?? []).map((c) => c.author_id)]),
  );
  const { data: authors } =
    authorIds.length > 0 ? await admin.from("profiles").select("id, username").in("id", authorIds) : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a.username]));

  const postMap = new Map((postsResult.data ?? []).map((p) => [p.id, p]));
  const commentMap = new Map((commentsResult.data ?? []).map((c) => [c.id, c]));
  const userMap = new Map((usersResult.data ?? []).map((u) => [u.id, u]));

  return reports.map((r) => {
    let preview: ReportWithContext["preview"];

    if (r.target_type === "post") {
      const post = postMap.get(r.target_id);
      preview = post
        ? {
            kind: "post",
            text: post.content ?? "(no text — media post)",
            authorId: post.author_id,
            authorUsername: authorMap.get(post.author_id) ?? null,
            isHidden: post.is_hidden,
          }
        : { kind: "unavailable", text: "This post no longer exists.", authorId: null, authorUsername: null };
    } else if (r.target_type === "comment") {
      const comment = commentMap.get(r.target_id);
      preview = comment
        ? {
            kind: "comment",
            text: comment.content,
            authorId: comment.author_id,
            authorUsername: authorMap.get(comment.author_id) ?? null,
            isHidden: comment.is_hidden,
          }
        : { kind: "unavailable", text: "This comment no longer exists.", authorId: null, authorUsername: null };
    } else if (r.target_type === "user") {
      const reportedUser = userMap.get(r.target_id);
      preview = reportedUser
        ? { kind: "user", text: `@${reportedUser.username}`, authorId: reportedUser.id, authorUsername: reportedUser.username }
        : { kind: "unavailable", text: "This account no longer exists.", authorId: null, authorUsername: null };
    } else {
      preview = { kind: "unavailable", text: `Reported ${r.target_type}`, authorId: null, authorUsername: null };
    }

    return {
      id: r.id,
      reporterUsername: reporterMap.get(r.reporter_id) ?? null,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      details: r.details,
      createdAt: r.created_at,
      preview,
    };
  });
}
