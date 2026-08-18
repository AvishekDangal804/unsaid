"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { ALLOWED_POST_MEDIA_TYPES, MAX_POST_IMAGES, MAX_POST_MEDIA_BYTES } from "@/lib/validation/post";

type UploadedImage = { url: string; uploading: boolean };

export function PostMediaUploader({
  userId,
  onChangeAction,
}: {
  userId: string;
  onChangeAction?: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  function notify(next: UploadedImage[]) {
    setImages(next);
    onChangeAction?.(next.filter((i) => !i.uploading).map((i) => i.url));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_POST_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`You can add up to ${MAX_POST_IMAGES} photos`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);

    for (const file of selected) {
      if (!ALLOWED_POST_MEDIA_TYPES.includes(file.type)) {
        setError("Please choose JPG, PNG, or WEBP images");
        continue;
      }
      if (file.size > MAX_POST_MEDIA_BYTES) {
        setError("Each image must be under 8MB");
        continue;
      }

      const placeholder: UploadedImage = { url: URL.createObjectURL(file), uploading: true };
      let current: UploadedImage[] = [];
      setImages((prev) => {
        current = [...prev, placeholder];
        return current;
      });

      try {
        const compressed = await compressImage(file);
        const supabase = createClient();
        const ext = compressed.type === "image/png" ? "png" : "jpg";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(path, compressed, { contentType: compressed.type });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-media").getPublicUrl(path);

        notify(current.map((img) => (img === placeholder ? { url: publicUrl, uploading: false } : img)));
      } catch {
        setError("Upload failed. Try again.");
        notify(current.filter((img) => img !== placeholder));
      }
    }
  }

  function handleRemove(index: number) {
    const next = images.filter((_, i) => i !== index);
    notify(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((img, index) => (
          <div
            key={img.url + index}
            className="relative size-20 overflow-hidden rounded-xl border border-border bg-surface-muted"
          >
            <Image src={img.url} alt="" fill sizes="80px" className="object-cover" unoptimized={img.uploading} />
            {img.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
            {!img.uploading && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                aria-label="Remove photo"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}

        {images.length < MAX_POST_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-surface-muted"
          >
            <ImagePlus className="size-5" />
            <span className="text-[11px]">Add</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_POST_MEDIA_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label="Add photos"
      />

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
