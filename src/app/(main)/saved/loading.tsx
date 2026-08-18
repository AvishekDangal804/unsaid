import { Skeleton, FeedSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Skeleton className="mb-4 h-6 w-20" />
      <FeedSkeleton count={2} />
    </div>
  );
}
