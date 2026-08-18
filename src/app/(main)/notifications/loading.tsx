import { Skeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <Skeleton className="mb-4 h-6 w-32" />
      <ListSkeleton />
    </div>
  );
}
