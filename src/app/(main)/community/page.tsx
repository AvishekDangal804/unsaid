import { createClient } from "@/lib/supabase/server";
import { CommunityCard } from "@/components/shared/community-card";

export const metadata = { title: "Communities" };

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const [{ data: communities }, { data: members }] = await Promise.all([
    supabase.from("communities").select("*").order("name"),
    supabase.from("community_members").select("community_id"),
  ]);

  const countByCommunity = new Map<string, number>();
  for (const m of members ?? []) {
    countByCommunity.set(m.community_id, (countByCommunity.get(m.community_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Communities</h1>
      {(communities ?? []).length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          No communities yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {(communities ?? []).map((c) => (
            <CommunityCard
              key={c.id}
              slug={c.slug}
              name={c.name}
              description={c.description}
              emoji={c.emoji}
              memberCount={countByCommunity.get(c.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
