import { Route } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { RoadmapClient } from '@/app/(app)/roadmap/roadmap-client';
import { getQuotaState } from '@/lib/ai/gateway';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Suggested Roadmap',
  description:
    'Turn a role, an idea or an existing startup into a phased plan with concrete tasks, milestones and the skills to pick up along the way.',
};

export default async function RoadmapPage() {
  const user = await getCurrentUser();
  const quota = await getQuotaState('roadmap', user?.id || null);

  let history = [];
  if (user) {
    try {
      history = (await repo.listRoadmaps(user.id, 5)).map((row) => ({
        id: row.id,
        title: row.title,
        inputKind: row.inputKind,
        inputText: row.inputText,
        horizon: row.horizon,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('[roadmap] history lookup failed:', error.message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="Suggested Roadmap"
        icon={Route}
        description="Describe the role you want, the idea you are chasing or the startup you already run. You get a sequenced plan where each phase produces the evidence the next one needs, scaled to the hours you can actually give it."
      />
      <RoadmapClient initialQuota={quota} history={history} isAuthed={Boolean(user)} />
    </>
  );
}
