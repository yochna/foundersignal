'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function BuilderMatchError({ error, reset }) {
  return (
    <RouteError
      scope="builder-match"
      error={error}
      reset={reset}
      message="The Builder Match diagnostic could not be loaded."
      hint="Your previous answers are stored separately, so retrying is safe and will not lose a completed run."
      retryLabel="Reload the diagnostic"
    />
  );
}
