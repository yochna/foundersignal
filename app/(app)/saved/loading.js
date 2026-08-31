import { Skeleton, SkeletonGrid } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-7 space-y-2.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>

      <SkeletonGrid count={3} />
    </div>
  );
}
