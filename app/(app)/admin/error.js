'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function AdminError({ error, reset }) {
  return (
    <RouteError
      scope="admin"
      error={error}
      reset={reset}
      message="The admin dashboard could not be loaded."
      hint="Each panel reads a different table, and one unavailable table is normally shown inline rather than failing the page, so this points at a store-wide problem."
      retryLabel="Reload the dashboard"
    />
  );
}
