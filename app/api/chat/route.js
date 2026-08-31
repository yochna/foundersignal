import { withApi, readJson, parseWith } from '@/lib/api';
import { chatRequest } from '@/lib/schemas';
import { runAi, retrieveForChat, getQuotaState } from '@/lib/ai/gateway';
import { loadOpportunities, toCompact } from '@/lib/opportunities';
import { requireUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** GET returns the stored transcript and remaining allowance. */
export const GET = withApi(async () => {
  const user = await requireUser();

  let history = [];
  try {
    history = await repo.listChat(user.id, 40);
  } catch (error) {
    console.error('[chat] could not load history:', error.message);
  }

  return { history, quota: await getQuotaState('chat', user.id) };
});

/**
 * POST /api/chat
 * Retrieval-augmented answer grounded in the opportunity corpus.
 */
export const POST = withApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const { message, history } = parseWith(chatRequest, body);

  const { opportunities } = await loadOpportunities();
  // 12 gives the model (or the heuristic fallback) enough breadth to answer
  // "give me N options" requests without falsely claiming the corpus is
  // smaller than it is.
  const retrieved = retrieveForChat(opportunities, message, 12);

  const { data, meta } = await runAi({
    feature: 'chat',
    userId: user.id,
    input: { message, history },
    promptExtras: { retrieved, corpusSize: opportunities.length },
    corpus: opportunities,
  });

  // Persist the exchange. Failures are logged; the answer still returns.
  try {
    await repo.appendChat(user.id, 'user', message);
    await repo.appendChat(user.id, 'assistant', data.answer);
  } catch (error) {
    console.error('[chat] could not persist transcript:', error.message);
  }

  const cited = (data.citedOpportunityIds || [])
    .map((id) => opportunities.find((o) => o.id === id))
    .filter(Boolean)
    .map(toCompact);

  return { result: data, cited, retrieved: retrieved.map((o) => o.id), meta };
});

/** DELETE clears the transcript. */
export const DELETE = withApi(async () => {
  const user = await requireUser();
  await repo.clearChat(user.id);
  return { cleared: true };
});
