import { withApi, readJson, parseWith } from '@/lib/api';
import { builderMatchRequest } from '@/lib/schemas';
import { runAi, getQuotaState } from '@/lib/ai/gateway';
import { loadOpportunities, toCompact } from '@/lib/opportunities';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';
import { builderQuestions } from '@/lib/seed/questions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = withApi(async () => {
  const user = await getCurrentUser();
  return {
    questions: builderQuestions,
    quota: await getQuotaState('builder-match', user?.id || null),
  };
});

/**
 * POST /api/builder-match
 * Ranks the whole feed against the founder's answers and hydrates each match
 * with its opportunity record so the client needs only this one call.
 */
export const POST = withApi(async (request) => {
  const body = await readJson(request);
  const { answers } = parseWith(builderMatchRequest, body);

  const user = await getCurrentUser();
  const { opportunities } = await loadOpportunities();

  const { data, meta } = await runAi({
    feature: 'builder-match',
    userId: user?.id || null,
    input: { answers },
    promptExtras: { questions: builderQuestions },
    corpus: opportunities,
  });

  const byId = new Map(opportunities.map((o) => [o.id, o]));

  const matches = (data.matches || [])
    .map((match) => {
      const opportunity = byId.get(match.opportunityId);
      // A model can hallucinate an id; drop rather than render a broken card.
      if (!opportunity) return null;
      return { ...match, opportunity: toCompact(opportunity) };
    })
    .filter(Boolean)
    .sort((a, b) => b.fitScore - a.fitScore);

  if (user) {
    try {
      await repo.saveQuizResult(user.id, answers, { ...data, matches });
    } catch (error) {
      console.error('[builder-match] could not persist quiz result:', error.message);
    }
  }

  return { profileSummary: data.profileSummary, matches, meta };
});
