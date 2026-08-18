"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/app/(main)/settings/profile/actions";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES } from "@/lib/validation/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AvatarUploader({
  userId,
  displayName,
  currentAvatarUrl,
}: {
  userId: string;
  displayName: string;
  currentAvatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image must be under 5MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    startTransition(async () => {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError("Upload failed. Try again.");
        setPreview(currentAvatarUrl);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const result = await updateAvatar(publicUrl);
      if ("error" in result) {
        setError(result.error);
        setPreview(currentAvatarUrl);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={preview} name={displayName} size={72} />
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_AVATAR_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload a profile photo"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Uploading..." : "Change photo"}
        </Button>
        {error && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
