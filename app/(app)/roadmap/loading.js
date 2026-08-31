import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-7 space-y-2.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>

      <Card tone="glass" className="p-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-24 w-full rounded-lg" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-4 h-10 w-40 rounded-lg" />
      </Card>
    </div>
  );
}
