import { Skeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <Skeleton className="mb-4 h-5 w-40" />
      <ListSkeleton count={6} />
    </div>
  );
}
