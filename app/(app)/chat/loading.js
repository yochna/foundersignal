import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-7 space-y-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>

      <div className="mx-auto max-w-3xl">
        <Card tone="glass" className="flex h-[min(70vh,640px)] flex-col overflow-hidden">
          <div className="flex-1 space-y-5 p-5">
            {[70, 85, 55].map((width, i) => (
              <div key={i} className={i % 2 ? 'flex flex-row-reverse gap-3' : 'flex gap-3'}>
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-14 rounded-xl" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
          <div className="border-t border-border/60 p-3.5">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </Card>
      </div>
    </div>
  );
}
