import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-7 space-y-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>

      <div className="mx-auto max-w-3xl">
        <Card tone="glass" className="p-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-32 w-full rounded-lg" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </Card>
      </div>
    </div>
  );
}
