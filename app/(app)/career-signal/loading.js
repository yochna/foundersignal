import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-7 space-y-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>

      <div className="mx-auto max-w-2xl">
        <Card tone="glass" className="p-6">
          <Skeleton className="h-10 w-56 rounded-lg" />
          <Skeleton className="mt-5 h-36 w-full rounded-lg" />
          <div className="mt-5 flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </Card>
      </div>
    </div>
  );
}
