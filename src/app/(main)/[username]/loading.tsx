import { ProfileHeaderSkeleton, FeedSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ProfileHeaderSkeleton />
      <div className="mt-4">
        <FeedSkeleton count={2} />
      </div>
    </div>
  );
}
