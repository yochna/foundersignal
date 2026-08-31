import { withApi, readJson, parseWith } from '@/lib/api';
import { AppError, ErrorCode, notFound } from '@/lib/errors';
import { saveOpportunityRequest } from '@/lib/schemas';
import { requireUser } from '@/lib/auth';
import { repo, describeStore } from '@/lib/db';
import { loadOpportunities, hydrateSaved, toCompact } from '@/lib/opportunities';

export const dynamic = 'force-dynamic';

/** GET returns the caller's watchlist, hydrated into full cards. */
export const GET = withApi(async () => {
  const user = await requireUser();
  const savedIds = await repo.listSaved(user.id);
  const { opportunities } = await loadOpportunities();
  const { opportunities: hydrated, missing } = hydrateSaved(savedIds, opportunities);

  return {
    saved: hydrated.map(toCompact),
    count: hydrated.length,
    missingIds: missing,
  };
});

/**
 * Rejects a write the store cannot honour, so the optimistic UI is told to
 * revert instead of showing a save that silently evaporates on reload.
 */
async function assertWritable() {
  const store = await describeStore();
  if (store.writable === false) {
    throw new AppError(ErrorCode.READ_ONLY, 'This deployment cannot persist changes', {
      hint: store.degraded
        ? 'The database is unreachable and this host has no writable disk. Try again shortly.'
        : 'The data store is read-only. Configure Supabase to make watchlists persistent.',
      meta: { driver: store.driver },
    });
  }
  return store;
}

/** Lets the client toast honestly about how long this save will survive. */
function persistenceOf(store) {
  if (store.degraded) return 'degraded';
  if (store.persistent === false) return 'ephemeral';
  return 'durable';
}

export const POST = withApi(async (request) => {
  const user = await requireUser();
  const { opportunityId } = parseWith(saveOpportunityRequest, await readJson(request));

  // Saving something that does not exist would create an orphan row that
  // renders as a blank card later.
  const opportunity = await repo.getOpportunity(opportunityId);
  if (!opportunity) throw notFound(`No opportunity with id "${opportunityId}"`);

  const store = await assertWritable();
  await repo.addSaved(user.id, opportunityId);

  return {
    saved: true,
    opportunityId,
    title: opportunity.title,
    count: (await repo.listSaved(user.id)).length,
    persistence: persistenceOf(store),
  };
});

export const DELETE = withApi(async (request) => {
  const user = await requireUser();
  const { opportunityId } = parseWith(saveOpportunityRequest, await readJson(request));

  const store = await assertWritable();
  await repo.removeSaved(user.id, opportunityId);

  return {
    saved: false,
    opportunityId,
    count: (await repo.listSaved(user.id)).length,
    persistence: persistenceOf(store),
  };
});
