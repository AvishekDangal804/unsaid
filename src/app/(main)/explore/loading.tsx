import { Skeleton, FeedSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <Skeleton className="h-6 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <FeedSkeleton count={2} />
    </div>
  );
}
