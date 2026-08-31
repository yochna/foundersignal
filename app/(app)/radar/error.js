'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { Button } from '@/components/ui/button';

export default function RadarError({ error, reset }) {
  useEffect(() => {
    console.error('[radar] render failed:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorPanel
        error={{
          code: 'INTERNAL',
          message: 'The opportunity radar could not be rendered.',
          hint: 'This is usually a transient data-store problem. Retrying reloads the feed from the store, or from bundled seed data if the store is unreachable.',
        }}
        onRetry={reset}
        retryLabel="Reload the radar"
      >
        <div className="mt-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/idea-validator">Use the idea validator instead</Link>
          </Button>
        </div>
      </ErrorPanel>
    </div>
  );
}
