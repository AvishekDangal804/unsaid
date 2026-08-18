import { Skeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="mt-6">
        <ListSkeleton count={3} />
      </div>
    </div>
  );
}
