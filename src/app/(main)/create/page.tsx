import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";
import { CreateForm } from "./create-form";
import { POST_TYPES } from "@/lib/validation/post";
import type { PostType } from "@/types/database.types";

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/create");
  }

  const params = await searchParams;
  const requestedType = Array.isArray(params.type) ? params.type[0] : params.type;
  const initialType: PostType = POST_TYPES.includes(requestedType as PostType)
    ? (requestedType as PostType)
    : "post";

  const communitySlug = Array.isArray(params.community) ? params.community[0] : params.community;
  const dailyQuestionId = Array.isArray(params.dailyQuestionId)
    ? params.dailyQuestionId[0]
    : params.dailyQuestionId;

  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("position");

  let community: { id: string; name: string; slug: string } | null = null;
  if (communitySlug) {
    const { data: communityRow } = await supabase
      .from("communities")
      .select("id, name, slug")
      .ilike("slug", communitySlug)
      .maybeSingle();

    if (communityRow) {
      const { data: membership } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityRow.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (membership) community = communityRow;
    }
  }

  let dailyQuestion: { id: string; question_text: string } | null = null;
  if (dailyQuestionId) {
    const { data: questionRow } = await supabase
      .from("daily_questions")
      .select("id, question_text")
      .eq("id", dailyQuestionId)
      .maybeSingle();
    dailyQuestion = questionRow ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {community ? `Post in ${community.name}` : "Create"}
      </h1>
      <CreateForm
        initialType={initialType}
        categories={categories ?? []}
        userId={user.id}
        community={community}
        dailyQuestion={dailyQuestion}
      />
    </div>
  );
}
