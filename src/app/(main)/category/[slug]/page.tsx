import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getFeedPosts } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";
import { Feed } from "@/components/post/feed";

async function getCategory(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").ilike("slug", slug).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return { title: category?.label ?? "Category" };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const user = await getCurrentUser();
  const { posts, nextCursor } = await getFeedPosts({
    scope: "latest",
    userId: user?.id ?? null,
    filter: { categoryId: category.id },
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-foreground">{category.label}</h1>
      <Feed
        initialPosts={posts}
        initialCursor={nextCursor}
        initialScope="latest"
        currentUserId={user?.id ?? null}
        showTabs={false}
        filter={{ categoryId: category.id }}
        emptyMessage="Nothing in this category yet."
      />
    </div>
  );
}
