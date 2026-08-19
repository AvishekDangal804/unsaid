import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getFollowList } from "@/lib/data/follows";
import { UserCard } from "@/components/shared/user-card";

async function getProfile(username: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").ilike("username", username).maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: PageProps<"/[username]/following">): Promise<Metadata> {
  const { username } = await params;
  return { title: `Following · @${username}` };
}

export default async function FollowingPage({ params }: PageProps<"/[username]/following">) {
  const { username } = await params;
  const [profile, user] = await Promise.all([getProfile(username), getCurrentUser()]);

  if (!profile) notFound();

  const isOwnProfile = user?.id === profile.id;
  const supabase = await createClient();

  let canSee = isOwnProfile || !profile.is_private;
  if (!canSee && user) {
    const { data } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    canSee = data?.status === "accepted";
  }

  const following = canSee ? await getFollowList(profile.id, "following") : [];

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        @{profile.username}&apos;s following
      </h1>

      {!canSee ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          This account is private. Follow to see who they follow.
        </p>
      ) : following.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          {isOwnProfile ? "You aren't following anyone yet." : "Not following anyone yet."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {following.map((p) => (
            <UserCard
              key={p.id}
              username={p.username}
              displayName={p.display_name}
              avatarUrl={p.avatar_url}
              bio={p.bio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
