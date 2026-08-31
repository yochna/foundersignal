'use client';

import { RouteError } from '@/components/feedback/route-error';

export default function IdeaValidatorError({ error, reset }) {
  return (
    <RouteError
      scope="idea-validator"
      error={error}
      reset={reset}
      message="The Idea Validator could not be loaded."
      hint="Validation history is read from the data store on load; if that store is unreachable the page retries without history."
      retryLabel="Reload the validator"
    />
  );
}
