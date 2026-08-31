import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" {...props} />;
}

/** Card-shaped placeholder used by every route-level loading.js. */
function SkeletonCard({ className, lines = 3 }) {
  return (
    <div className={cn('glass rounded-xl p-5', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${92 - i * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 6, className }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonGrid };
