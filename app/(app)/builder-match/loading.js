import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-7 space-y-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>

      <div className="mx-auto max-w-2xl">
        <Skeleton className="mb-6 h-1 w-full rounded-full" />
        <Card tone="glass" className="p-6 sm:p-7">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <div className="mt-6 space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
