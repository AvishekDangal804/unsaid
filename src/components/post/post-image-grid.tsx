import Image from "next/image";
import { cn } from "@/lib/utils";

export function PostImageGrid({ images }: { images: { url: string }[] }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-muted">
        <Image src={images[0].url} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-1 overflow-hidden rounded-xl",
        images.length === 2 && "grid-cols-2",
        images.length === 3 && "grid-cols-2",
        images.length >= 4 && "grid-cols-2",
      )}
    >
      {images.slice(0, 4).map((img, i) => (
        <div
          key={img.url}
          className={cn(
            "relative aspect-square bg-surface-muted",
            images.length === 3 && i === 0 && "row-span-2 aspect-auto",
          )}
        >
          <Image src={img.url} alt="" fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover" />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
              +{images.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
