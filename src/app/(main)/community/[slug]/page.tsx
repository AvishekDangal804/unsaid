import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getFeedPosts } from "@/lib/data/posts";
import { Feed } from "@/components/post/feed";
import { buttonVariants } from "@/components/ui/button";
import { JoinButton } from "./join-button";

async function getCommunity(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("communities").select("*").ilike("slug", slug).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/community/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  return { title: community?.name ?? "Community" };
}

export default async function CommunityPage({ params }: PageProps<"/community/[slug]">) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();

  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ count: memberCount }, membershipResult, feedResult] = await Promise.all([
    supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", community.id),
    user
      ? supabase
          .from("community_members")
          .select("user_id")
          .eq("community_id", community.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getFeedPosts({
      scope: "latest",
      userId: user?.id ?? null,
      filter: { communityId: community.id },
    }),
  ]);

  const isMember = Boolean(membershipResult.data);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-muted text-2xl">
            {community.emoji}
          </span>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{community.name}</h1>
            {community.description && (
              <p className="text-sm text-muted-foreground">{community.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{memberCount ?? 0} members</p>
          </div>
        </div>
        <JoinButton
          communityId={community.id}
          slug={community.slug}
          initialJoined={isMember}
          isLoggedIn={Boolean(user)}
        />
      </div>

      {isMember && (
        <Link
          href={`/create?type=post&community=${community.slug}`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "mb-4" })}
        >
          Post in {community.name}
        </Link>
      )}

      <Feed
        initialPosts={feedResult.posts}
        initialCursor={feedResult.nextCursor}
        initialScope="latest"
        currentUserId={user?.id ?? null}
        showTabs={false}
        filter={{ communityId: community.id }}
        emptyMessage="Nothing posted here yet."
      />
    </div>
  );
}
