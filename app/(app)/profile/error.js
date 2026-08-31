'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function ProfileError({ error, reset }) {
  return (
    <RouteError
      scope="profile"
      error={error}
      reset={reset}
      message="Your profile could not be loaded."
      hint="The page reads your identity, your saved profile and your activity counts together; if the data store is unreachable none of them resolve."
      retryLabel="Reload the profile"
    />
  );
}
