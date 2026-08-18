import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { searchUsers, searchPostsByText, searchHashtags, searchCommunities } from "@/lib/data/search";
import { SearchBar } from "@/components/shared/search-bar";
import { UserCard } from "@/components/shared/user-card";
import { CommunityCard } from "@/components/shared/community-card";
import { PostCard } from "@/components/post/post-card";
import { Hash } from "lucide-react";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (qRaw ?? "").trim();
  const user = await getCurrentUser();

  if (!query) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <SearchBar />
        <p className="py-16 text-center text-sm text-muted-foreground">
          Search for people, posts, hashtags, or communities.
        </p>
      </div>
    );
  }

  const [users, posts, hashtags, communities] = await Promise.all([
    searchUsers(query),
    searchPostsByText(query, user?.id ?? null),
    searchHashtags(query),
    searchCommunities(query),
  ]);

  const hasAnyResults = users.length + posts.length + hashtags.length + communities.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <SearchBar initialQuery={query} />

      {!hasAnyResults ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No results for &quot;{query}&quot;. Try something else.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {users.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">People</h2>
              <div className="flex flex-col gap-2">
                {users.map((u) => (
                  <UserCard
                    key={u.id}
                    username={u.username}
                    displayName={u.display_name}
                    avatarUrl={u.avatar_url}
                    bio={u.bio}
                  />
                ))}
              </div>
            </section>
          )}

          {communities.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Communities</h2>
              <div className="flex flex-col gap-2">
                {communities.map((c) => (
                  <CommunityCard
                    key={c.id}
                    slug={c.slug}
                    name={c.name}
                    description={c.description}
                    emoji={c.emoji}
                  />
                ))}
              </div>
            </section>
          )}

          {hashtags.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Hashtags</h2>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h) => (
                  <Link
                    key={h.id}
                    href={`/hashtag/${h.name}`}
                    className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted"
                  >
                    <Hash className="size-3.5 text-primary" />
                    {h.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Posts</h2>
              <div className="flex flex-col gap-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={user?.id ?? null} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
