'use client';

import * as React from 'react';
import Link from 'next/link';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { Button } from '@/components/ui/button';

/**
 * Shared body for route-level error.js boundaries. Each route keeps its own
 * error.js (Next requires one per segment) but only supplies the copy.
 */
export function RouteError({
  scope,
  error,
  reset,
  message,
  hint,
  retryLabel = 'Try again',
  escapeHref = '/radar',
  escapeLabel = 'Back to the radar',
}) {
  React.useEffect(() => {
    console.error(`[${scope}] render failed:`, error);
  }, [scope, error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorPanel
        error={{
          code: 'INTERNAL',
          message,
          hint,
          // Surfacing the digest gives you something to grep for in Vercel logs,
          // where the real stack lives.
          requestId: error?.digest,
        }}
        onRetry={reset}
        retryLabel={retryLabel}
      >
        <div className="mt-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={escapeHref}>{escapeLabel}</Link>
          </Button>
        </div>
      </ErrorPanel>
    </div>
  );
}

export default RouteError;
