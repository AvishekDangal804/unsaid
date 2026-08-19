import { Skeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <Skeleton className="mb-2 h-5 w-32" />
      <Skeleton className="mb-6 h-3.5 w-64" />
      <Skeleton className="mb-4 h-11 w-full rounded-full" />
      <ListSkeleton count={5} />
    </div>
  );
}
