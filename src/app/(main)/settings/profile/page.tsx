import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Lock, ShieldAlert, Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getProfileById } from "@/lib/data/profile";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { LogoutButton } from "@/components/layout/logout-button";
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

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground hover:bg-border"
        >
          <GraduationCap className="size-4 text-primary" />
          Edit country, education, or school
        </Link>
        <Link
          href="/settings/privacy"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground hover:bg-border"
        >
          <Lock className="size-4 text-primary" />
          Privacy
        </Link>
        <Link
          href="/settings/notifications"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground hover:bg-border"
        >
          <Bell className="size-4 text-primary" />
          Notifications
        </Link>
        <Link
          href="/settings/safety"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground hover:bg-border"
        >
          <ShieldAlert className="size-4 text-primary" />
          Blocked &amp; muted accounts
        </Link>
      </div>

      <div className="mt-6 flex justify-end sm:hidden">
        <LogoutButton />
      </div>
    </div>
  );
}
