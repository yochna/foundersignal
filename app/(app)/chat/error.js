'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function ChatError({ error, reset }) {
  return (
    <RouteError
      scope="chat"
      error={error}
      reset={reset}
      message="The Copilot could not be loaded."
      hint="Your transcript is stored server-side, so it will reappear once the page loads. If this repeats, the data store is likely unreachable."
      retryLabel="Reload the Copilot"
    />
  );
}
