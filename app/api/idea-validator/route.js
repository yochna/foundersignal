import { withApi, readJson, parseWith } from '@/lib/api';
import { validateIdeaRequest } from '@/lib/schemas';
import { runAi, getQuotaState } from '@/lib/ai/gateway';
import { loadOpportunities } from '@/lib/opportunities';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** GET returns the remaining allowance so the form can show it before submitting. */
export const GET = withApi(async () => {
  const user = await getCurrentUser();
  return { quota: await getQuotaState('idea-validator', user?.id || null) };
});

/**
 * POST /api/idea-validator
 * Scores a free-text idea. Always returns a scorecard: the gateway falls back to
 * deterministic scoring rather than failing.
 */
export const POST = withApi(async (request) => {
  const body = await readJson(request);
  const { idea } = parseWith(validateIdeaRequest, body);

  const user = await getCurrentUser();
  const { opportunities } = await loadOpportunities();

  const { data, meta } = await runAi({
    feature: 'idea-validator',
    userId: user?.id || null,
    input: { idea },
    corpus: opportunities,
  });

  // Persist history for signed-in users. A storage failure must not lose the
  // result the user is waiting for, so it is logged and swallowed.
  if (user) {
    try {
      await repo.saveValidation(user.id, idea, data, data.validationScore);
    } catch (error) {
      console.error('[idea-validator] could not persist validation:', error.message);
    }
  }

  // Resolve cited ids into displayable records.
  const related = (data.relatedOpportunityIds || [])
    .map((id) => opportunities.find((o) => o.id === id))
    .filter(Boolean)
    .slice(0, 3)
    .map((o) => ({ id: o.id, title: o.title, score: o.score, vertical: o.vertical }));

  return { result: data, related, meta };
});
