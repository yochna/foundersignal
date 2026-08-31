'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { Button } from '@/components/ui/button';

export default function OpportunityError({ error, reset }) {
  useEffect(() => {
    console.error('[opportunity detail] render failed:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorPanel
        error={{
          code: 'INTERNAL',
          message: 'This opportunity brief could not be loaded.',
          hint: 'The record may be mid-update from an ingestion run. Retry, or go back to the radar for the current feed.',
        }}
        onRetry={reset}
      >
        <div className="mt-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/radar">Back to radar</Link>
          </Button>
        </div>
      </ErrorPanel>
    </div>
  );
}
