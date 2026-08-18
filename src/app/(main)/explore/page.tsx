import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getTrendingPosts, getTrendingHashtags, getFeedPosts } from "@/lib/data/posts";
import { getTodaysDailyQuestion, getTopCommunities } from "@/lib/data/discovery";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post/post-card";
import { CommunityCard } from "@/components/shared/community-card";
import { buttonVariants } from "@/components/ui/button";
import { Hash, MessageCircleHeart } from "lucide-react";

export const metadata = { title: "Explore" };

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [trendingPosts, trendingHashtags, dailyQuestion, topCommunities, { data: categories }] =
    await Promise.all([
      getTrendingPosts(user?.id ?? null, 5),
      getTrendingHashtags(8),
      getTodaysDailyQuestion(),
      getTopCommunities(4),
      supabase.from("categories").select("*").order("position"),
    ]);

  const dailyAnswers = dailyQuestion
    ? await getFeedPosts({
        scope: "latest",
        userId: user?.id ?? null,
        filter: { dailyQuestionId: dailyQuestion.id },
        limit: 3,
      })
    : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-lg font-semibold text-foreground">Explore</h1>

      {dailyQuestion && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-primary">
            <MessageCircleHeart className="size-4" />
            Daily Question
          </div>
          <p className="mb-3 text-base font-medium text-foreground">{dailyQuestion.question_text}</p>
          <Link
            href={`/create?type=question&dailyQuestionId=${dailyQuestion.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            Answer
          </Link>
          {dailyAnswers && dailyAnswers.posts.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {dailyAnswers.posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={user?.id ?? null} />
              ))}
            </div>
          )}
        </section>
      )}

      {trendingHashtags.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">🔥 Trending hashtags</h2>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((h) => (
              <Link
                key={h.name}
                href={`/hashtag/${h.name}`}
                className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted"
              >
                <Hash className="size-3.5 text-primary" />
                {h.name}
                <span className="text-xs text-muted-foreground">{h.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topCommunities.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Communities</h2>
            <Link href="/community" className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {topCommunities.map((c) => (
              <CommunityCard
                key={c.id}
                slug={c.slug}
                name={c.name}
                description={c.description}
                emoji={c.emoji}
                memberCount={c.memberCount}
              />
            ))}
          </div>
        </section>
      )}

      {categories && categories.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {trendingPosts.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">🔥 Trending posts</h2>
          <div className="flex flex-col gap-3">
            {trendingPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id ?? null} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
