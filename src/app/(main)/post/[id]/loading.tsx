import { PostCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <PostCardSkeleton />
      <div className="mt-4 space-y-2 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-3/4" />
      </div>
    </div>
  );
}
