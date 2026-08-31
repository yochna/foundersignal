import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function OpportunityLoading() {
  return (
    <>
      <Skeleton className="mb-5 h-8 w-36" />

      <div className="mb-7">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-9 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-5 h-16 w-full max-w-3xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-5">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={6} />
          <SkeletonCard lines={4} />
        </div>
        <div className="hidden space-y-5 lg:block">
          <Skeleton className="h-96" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </>
  );
}
