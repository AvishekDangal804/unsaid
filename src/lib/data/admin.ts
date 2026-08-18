import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/types/database.types";

export const getStaffRole = cache(async (userId: string): Promise<StaffRole | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("admin_roles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role ?? null;
});
