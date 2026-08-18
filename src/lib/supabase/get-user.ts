import { cache } from "react";
import { createClient } from "./server";

// Deduplicates auth.getUser() calls within a single request — Header, layouts,
// and pages all need the current user, and each call is a round trip to Supabase.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
