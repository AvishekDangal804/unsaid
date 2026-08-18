import { FeedSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <FeedSkeleton />
    </div>
  );
}
