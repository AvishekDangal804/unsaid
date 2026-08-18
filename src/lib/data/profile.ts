import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Deduplicates profile-by-id lookups within a single request.
export const getProfileById = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
});
