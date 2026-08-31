import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { ValidatorClient } from '@/app/(app)/idea-validator/validator-client';
import { getQuotaState } from '@/lib/ai/gateway';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Idea Validator',
  description:
    'Score your own startup idea across demand, competition, feasibility, timing, India relevance and regulatory pressure.',
};

export default async function IdeaValidatorPage() {
  const user = await getCurrentUser();
  const quota = await getQuotaState('idea-validator', user?.id || null);

  let history = [];
  if (user) {
    try {
      history = (await repo.listValidations(user.id, 5)).map((row) => ({
        id: row.id,
        ideaText: row.ideaText,
        validationScore: row.validationScore,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('[idea-validator] history lookup failed:', error.message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Evaluate"
        title="Idea Validator"
        icon={Sparkles}
        description="Describe an idea and get a scorecard built from the same six dimensions used to rank the radar, plus the market gaps, competitors, a first build and the risks that would kill it."
      />
      <ValidatorClient initialQuota={quota} history={history} isAuthed={Boolean(user)} />
    </>
  );
}
