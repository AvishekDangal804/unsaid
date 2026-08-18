"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ModerationActionType, ReportTargetType } from "@/types/database.types";

export type ActionResult = { error: string } | { success: true };

export async function performModeration(params: {
  action: ModerationActionType;
  targetType: ReportTargetType;
  targetId: string;
  reportId?: string;
  reason?: string;
  durationHours?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to log in first" };

  const { error } = await supabase.rpc("moderate", {
    p_action: params.action,
    p_target_type: params.targetType,
    p_target_id: params.targetId,
    p_report_id: params.reportId ?? null,
    p_reason: params.reason ?? null,
    p_duration_hours: params.durationHours ?? 24,
  });

  if (error) {
    return { error: error.message === "not authorized" ? "You don't have permission to do that." : "Something went wrong. Try again." };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/users");
  revalidatePath("/admin/logs");
  return { success: true };
}
