import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getPostsByAuthor } from "@/lib/data/posts";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { PostCard } from "@/components/post/post-card";
import { FollowButton } from "./follow-button";

async function getProfile(username: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").ilike("username", username).maybeSingle();
  return data;
}

async function getInstitutionName(institutionId: string | null) {
  if (!institutionId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("institutions")
    .select("name")
    .eq("id", institutionId)
    .maybeSingle();
  return data?.name ?? null;
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
  const institutionName = await getInstitutionName(profile.institution_id);

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
  const canSeePosts = isOwnProfile || !profile.is_private || relationship === "accepted";
  const posts = canSeePosts ? await getPostsByAuthor(profile.id, user?.id ?? null) : [];

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

          {institutionName && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <GraduationCap className="size-4 text-primary" />
              {institutionName}
            </div>
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

      <div className="mt-4">
        {!canSeePosts ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <p className="text-sm text-muted-foreground">
              This account is private. Follow to see their posts.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Be the first to share something.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id ?? null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
