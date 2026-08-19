"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoLightbox } from "./photo-lightbox";

type PostMedia = { url: string; type: "image" | "video" };

function MediaThumb({ media }: { media: PostMedia }) {
  if (media.type === "video") {
    return (
      <>
        <video src={media.url} className="size-full object-cover" muted playsInline preload="metadata" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <Play className="size-8 text-white" fill="white" />
        </div>
      </>
    );
  }
  return <Image src={media.url} alt="" fill sizes="(max-width: 640px) 100vw, 600px" quality={90} className="object-cover" />;
}

export function PostImageGrid({ images }: { images: PostMedia[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className="relative block aspect-4/3 w-full overflow-hidden rounded-xl bg-surface-muted"
          aria-label={images[0].type === "video" ? "Play video" : "View photo"}
        >
          <MediaThumb media={images[0]} />
        </button>
        {openIndex !== null && (
          <PhotoLightbox
            key={openIndex}
            images={images}
            index={openIndex}
            onCloseAction={() => setOpenIndex(null)}
            onNavigateAction={setOpenIndex}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-1 overflow-hidden rounded-xl",
          images.length === 2 && "grid-cols-2",
          images.length === 3 && "grid-cols-2",
          images.length >= 4 && "grid-cols-2",
        )}
      >
        {images.slice(0, 4).map((img, i) => (
          <button
            type="button"
            key={img.url}
            onClick={() => setOpenIndex(i)}
            className={cn(
              "relative block aspect-square bg-surface-muted",
              images.length === 3 && i === 0 && "row-span-2 aspect-auto",
            )}
            aria-label={img.type === "video" ? `Play video ${i + 1}` : `View photo ${i + 1}`}
          >
            <MediaThumb media={img} />
            {i === 3 && images.length > 4 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                +{images.length - 4}
              </div>
            )}
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <PhotoLightbox
          images={images}
          index={openIndex}
          onCloseAction={() => setOpenIndex(null)}
          onNavigateAction={setOpenIndex}
        />
      )}
    </>
  );
}
