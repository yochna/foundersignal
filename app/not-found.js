import Link from 'next/link';
import { Compass, Radar as RadarIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="mesh-bg flex min-h-screen items-center justify-center px-5 py-16">
      <Card tone="glass" className="w-full max-w-md p-8 text-center">
        <Compass className="mx-auto h-10 w-10 text-primary/60" aria-hidden="true" />
        <p className="mono mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          404
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-on-surface">
          Nothing at this address
        </h1>
        <p className="mt-2.5 text-xs leading-relaxed text-on-surface-variant">
          This page does not exist, or an opportunity that used to live here has been retired by an
          ingestion run. The radar always has the current feed.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button asChild size="sm">
            <Link href="/radar">
              <RadarIcon />
              Go to the radar
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/idea-validator">
              <Sparkles />
              Validate an idea
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
