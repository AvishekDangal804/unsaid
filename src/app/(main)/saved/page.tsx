import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getSavedPosts } from "@/lib/data/posts";
import { PostCard } from "@/components/post/post-card";

export default async function SavedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/saved");
  }

  const posts = await getSavedPosts(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Saved</h1>

      {posts.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          Nothing saved yet. Tap the menu on any post to save it for later.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
