import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { ProfileEditForm } from "./profile-edit-form";

export default async function EditProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/settings/profile");
  }

  const profile = await getProfileById(user.id);

  if (!profile) {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Edit profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This is what people will see when they visit your profile.
      </p>

      <div className="mb-6">
        <AvatarUploader
          userId={user.id}
          displayName={profile.display_name ?? profile.username}
          currentAvatarUrl={profile.avatar_url}
        />
      </div>

      <ProfileEditForm profile={profile} />
    </div>
  );
}
