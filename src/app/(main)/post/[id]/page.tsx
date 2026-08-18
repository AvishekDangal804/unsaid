import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getSinglePost } from "@/lib/data/posts";
import { getCommentsForPost } from "@/lib/data/comments";
import { PostCard } from "@/components/post/post-card";
import { CommentsSection } from "@/components/post/comments-section";

export async function generateMetadata({ params }: PageProps<"/post/[id]">): Promise<Metadata> {
  const { id } = await params;
  const post = await getSinglePost(id, null);
  if (!post) return { title: "Post not found" };
  return { title: post.content ? post.content.slice(0, 60) : "Post" };
}

export default async function PostDetailPage({ params }: PageProps<"/post/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const post = await getSinglePost(id, user?.id ?? null);

  if (!post) {
    notFound();
  }

  const comments = await getCommentsForPost(id, user?.id ?? null);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PostCard post={post} currentUserId={user?.id ?? null} />
      <div className="mt-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <CommentsSection
          postId={id}
          canModerate={post.isOwnPost}
          commentsEnabled={post.commentsEnabled}
          currentUserId={user?.id ?? null}
          comments={comments}
        />
      </div>
    </div>
  );
}
