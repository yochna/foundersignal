'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function SavedError({ error, reset }) {
  return (
    <RouteError
      scope="saved"
      error={error}
      reset={reset}
      message="Your watchlist could not be loaded."
      hint="Saved items live in the data store, so nothing has been lost. If this keeps happening, the store is likely unreachable."
      retryLabel="Reload the watchlist"
    />
  );
}
