import { createClient } from "@/lib/supabase/server";

// Deterministic daily rotation through the question pool — no per-day rows
// needed yet. A future admin panel can add a scheduled date column without
// changing how "today's question" is resolved for existing entries.
export async function getTodaysDailyQuestion() {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("daily_questions")
    .select("*")
    .order("created_at", { ascending: true });

  if (!questions || questions.length === 0) return null;

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return questions[dayOfYear % questions.length];
}

export async function getTopCommunities(limit = 5) {
  const supabase = await createClient();
  const [{ data: communities }, { data: members }] = await Promise.all([
    supabase.from("communities").select("*"),
    supabase.from("community_members").select("community_id"),
  ]);

  const countByCommunity = new Map<string, number>();
  for (const m of members ?? []) {
    countByCommunity.set(m.community_id, (countByCommunity.get(m.community_id) ?? 0) + 1);
  }

  return (communities ?? [])
    .map((c) => ({ ...c, memberCount: countByCommunity.get(c.id) ?? 0 }))
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, limit);
}
