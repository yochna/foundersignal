import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-7 space-y-2.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[250px] rounded-xl" />
        <Skeleton className="h-[250px] rounded-xl" />
      </div>

      <Card tone="glass" className="mb-6 space-y-4 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  );
}
