import { Skeleton, SkeletonGrid } from '@/components/ui/skeleton';

export default function RadarLoading() {
  return (
    <>
      <div className="mb-7">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-3 h-7 w-14" />
            <Skeleton className="mt-2 h-2.5 w-24" />
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 lg:col-span-2" />
        <Skeleton className="h-56" />
      </div>

      <Skeleton className="mb-6 h-20" />
      <SkeletonGrid count={6} />
    </>
  );
}
