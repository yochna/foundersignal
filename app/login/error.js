'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function LoginError({ error, reset }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-5">
      <RouteError
        scope="login"
        error={error}
        reset={reset}
        message="The sign-in page could not be loaded."
        hint="This usually means NEXTAUTH_SECRET or NEXTAUTH_URL is missing on the server. You can still browse the radar without signing in."
        retryLabel="Try again"
      />
    </div>
  );
}
