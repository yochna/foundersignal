import { withApi, readJson, parseWith } from '@/lib/api';
import { roadmapRequest } from '@/lib/schemas';
import { runAi, getQuotaState } from '@/lib/ai/gateway';
import { loadOpportunities } from '@/lib/opportunities';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** GET returns the remaining allowance so the form can show it before submitting. */
export const GET = withApi(async () => {
  const user = await getCurrentUser();
  return { quota: await getQuotaState('roadmap', user?.id || null) };
});

/**
 * POST /api/roadmap
 * Turns a role, idea or startup into a phased execution plan. Always returns a
 * plan: the gateway falls back to a deterministic blueprint rather than failing.
 */
export const POST = withApi(async (request) => {
  const body = await readJson(request);
  const input = parseWith(roadmapRequest, body);

  const user = await getCurrentUser();
  const { opportunities } = await loadOpportunities();

  const { data, meta } = await runAi({
    feature: 'roadmap',
    userId: user?.id || null,
    input,
    corpus: opportunities,
  });

  // History is a convenience, so a storage failure must not lose the plan the
  // user is waiting for.
  if (user) {
    try {
      await repo.saveRoadmap({
        userId: user.id,
        inputKind: input.kind,
        inputText: input.goal,
        horizon: input.horizon,
        title: data.title,
        result: data,
      });
    } catch (error) {
      console.error('[roadmap] could not persist roadmap:', error.message);
    }
  }

  const related = (data.relatedOpportunityIds || [])
    .map((id) => opportunities.find((o) => o.id === id))
    .filter(Boolean)
    .slice(0, 3)
    .map((o) => ({ id: o.id, title: o.title, score: o.score, vertical: o.vertical }));

  return { result: data, related, meta };
});
