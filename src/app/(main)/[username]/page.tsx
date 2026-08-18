import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { FollowButton } from "./follow-button";

async function getProfile(username: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").ilike("username", username).maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Profile not found" };
  return { title: `@${profile.username}` };
}

export default async function ProfilePage({ params }: PageProps<"/[username]">) {
  const { username } = await params;
  const [profile, user] = await Promise.all([getProfile(username), getCurrentUser()]);

  if (!profile) {
    notFound();
  }

  const supabase = await createClient();
  const isOwnProfile = user?.id === profile.id;

  const [{ count: followerCount }, { count: followingCount }, relationshipResult] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id)
        .eq("status", "accepted"),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id)
        .eq("status", "accepted"),
      user && !isOwnProfile
        ? supabase
            .from("follows")
            .select("status")
            .eq("follower_id", user.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const relationship: "none" | "pending" | "accepted" = relationshipResult.data?.status ?? "none";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col items-center gap-4 border-b border-border pb-6 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar
          src={profile.avatar_url}
          name={profile.display_name ?? profile.username}
          size={88}
        />
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{profile.bio}</p>
          )}

          <div className="mt-3 flex justify-center gap-4 text-sm sm:justify-start">
            <span>
              <strong className="text-foreground">{followerCount ?? 0}</strong>{" "}
              <span className="text-muted-foreground">followers</span>
            </span>
            <span>
              <strong className="text-foreground">{followingCount ?? 0}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
          </div>

          <div className="mt-4 flex justify-center sm:justify-start">
            {isOwnProfile ? (
              <Link
                href="/settings/profile"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Edit profile
              </Link>
            ) : (
              <FollowButton
                targetId={profile.id}
                targetUsername={profile.username}
                targetIsPrivate={profile.is_private}
                initialRelationship={relationship}
                isLoggedIn={Boolean(user)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <p className="text-sm text-muted-foreground">
          {profile.is_private && !isOwnProfile && relationship !== "accepted"
            ? "This account is private. Follow to see their posts."
            : "Nothing here yet. Be the first to share something."}
        </p>
      </div>
    </div>
  );
}
