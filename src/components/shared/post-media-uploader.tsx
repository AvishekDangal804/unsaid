"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Video, X, Loader2, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import {
  ALLOWED_POST_MEDIA_TYPES,
  ALLOWED_POST_VIDEO_TYPES,
  MAX_POST_IMAGES,
  MAX_POST_MEDIA_BYTES,
  MAX_POST_VIDEO_BYTES,
  MAX_POST_VIDEO_SECONDS,
} from "@/lib/validation/post";

type UploadedImage = { url: string; uploading: boolean; type: "image" | "video" };

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Couldn't read video"));
    };
    video.src = URL.createObjectURL(file);
  });
}

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
      setError(`You can add up to ${MAX_POST_IMAGES} files`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);

    for (const file of selected) {
      const isVideo = ALLOWED_POST_VIDEO_TYPES.includes(file.type);
      const isImage = ALLOWED_POST_MEDIA_TYPES.includes(file.type);

      if (!isVideo && !isImage) {
        setError("Please choose a JPG, PNG, WEBP photo, or an MP4/WEBM/MOV video");
        continue;
      }

      if (isImage && file.size > MAX_POST_MEDIA_BYTES) {
        setError("Each image must be under 8MB");
        continue;
      }

      if (isVideo) {
        if (file.size > MAX_POST_VIDEO_BYTES) {
          setError("Videos must be under 150MB");
          continue;
        }
        try {
          const duration = await getVideoDuration(file);
          if (duration > MAX_POST_VIDEO_SECONDS) {
            setError(`Videos must be ${MAX_POST_VIDEO_SECONDS / 60} minutes or shorter`);
            continue;
          }
        } catch {
          setError("Couldn't read that video. Try a different file.");
          continue;
        }
      }

      const placeholder: UploadedImage = {
        url: URL.createObjectURL(file),
        uploading: true,
        type: isVideo ? "video" : "image",
      };
      let current: UploadedImage[] = [];
      setImages((prev) => {
        current = [...prev, placeholder];
        return current;
      });

      try {
        const supabase = createClient();
        let uploadBody: Blob = file;
        let ext: string;
        let contentType: string;

        if (isVideo) {
          ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
          contentType = file.type;
        } else {
          uploadBody = await compressImage(file);
          ext = uploadBody.type === "image/png" ? "png" : "jpg";
          contentType = uploadBody.type;
        }

        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(path, uploadBody, { contentType });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-media").getPublicUrl(path);

        notify(
          current.map((img) => (img === placeholder ? { ...img, url: publicUrl, uploading: false } : img)),
        );
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
            {img.type === "video" ? (
              <>
                <video src={img.url} className="size-full object-cover" muted playsInline preload="metadata" />
                {!img.uploading && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="size-6 text-white" fill="white" />
                  </div>
                )}
              </>
            ) : (
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" unoptimized={img.uploading} />
            )}
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
            <span className="flex gap-0.5">
              <ImagePlus className="size-4" />
              <Video className="size-4" />
            </span>
            <span className="text-[11px]">Add</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={[...ALLOWED_POST_MEDIA_TYPES, ...ALLOWED_POST_VIDEO_TYPES].join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label="Add photos or videos"
      />

      <p className="mt-2 text-[11px] text-muted-foreground">
        Photos up to 8MB · Videos up to {MAX_POST_VIDEO_SECONDS / 60} min and 150MB
      </p>

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
