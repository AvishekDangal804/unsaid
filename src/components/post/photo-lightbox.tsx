"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

const TITLE_ID = "photo-lightbox-title";

export function PhotoLightbox({
  images,
  index,
  onCloseAction,
  onNavigateAction,
}: {
  images: { url: string; type?: "image" | "video" }[];
  index: number;
  onCloseAction: () => void;
  onNavigateAction: (index: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isVideo = images[index].type === "video";

  useEffect(() => {
    closeButtonRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseAction();
      if (e.key === "ArrowLeft" && index > 0) onNavigateAction(index - 1);
      if (e.key === "ArrowRight" && index < images.length - 1) onNavigateAction(index + 1);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onCloseAction, onNavigateAction]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      className="animate-fade-in fixed inset-0 z-60 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCloseAction();
      }}
    >
      <h2 id={TITLE_ID} className="sr-only">
        {isVideo ? "Video" : "Photo"} {index + 1} of {images.length}
      </h2>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onCloseAction}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>

      {!isVideo && (
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
        >
          {zoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
        </button>
      )}

      {images.length > 1 && index > 0 && (
        <button
          type="button"
          onClick={() => onNavigateAction(index - 1)}
          className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          aria-label="Previous photo"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      {images.length > 1 && index < images.length - 1 && (
        <button
          type="button"
          onClick={() => onNavigateAction(index + 1)}
          className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          aria-label="Next photo"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      {isVideo ? (
        <div className="flex h-full w-full items-center justify-center px-4 py-12" onClick={(e) => e.stopPropagation()}>
          <video
            src={images[index].url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg"
          />
        </div>
      ) : (
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-200",
            zoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in overflow-hidden",
          )}
          onClick={() => setZoomed((z) => !z)}
        >
          <div
            className={cn(
              "relative mx-auto my-8 h-[calc(100%-4rem)] w-[calc(100%-2rem)] transition-transform duration-200 sm:w-[calc(100%-8rem)]",
              zoomed && "scale-150",
            )}
          >
            <Image
              src={images[index].url}
              alt=""
              fill
              sizes="100vw"
              quality={90}
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
