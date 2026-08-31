'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function CareerSignalError({ error, reset }) {
  return (
    <RouteError
      scope="career-signal"
      error={error}
      reset={reset}
      message="Career Signal could not be loaded."
      hint="No uploaded file is held on the server, so nothing was lost. Retrying reloads the page and you can upload again."
      retryLabel="Reload Career Signal"
    />
  );
}
