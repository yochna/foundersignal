'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function RoadmapError({ error, reset }) {
  return (
    <RouteError
      scope="roadmap"
      error={error}
      reset={reset}
      message="The roadmap planner could not be loaded."
      hint="Saved roadmaps are read from the data store on load; if that store is unreachable the page retries without history."
      retryLabel="Reload the planner"
    />
  );
}
