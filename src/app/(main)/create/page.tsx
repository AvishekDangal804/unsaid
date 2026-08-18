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

  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("position");

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Create</h1>
      <CreateForm initialType={initialType} categories={categories ?? []} userId={user.id} />
    </div>
  );
}
