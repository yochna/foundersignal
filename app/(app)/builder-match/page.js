import { UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { MatchClient } from '@/app/(app)/builder-match/match-client';
import { getQuotaState } from '@/lib/ai/gateway';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';
import { builderQuestions } from '@/lib/seed/questions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Builder Match',
  description:
    'Answer five questions and get the opportunities ranked against your skills, capital, time and regulatory risk appetite.',
};

export default async function BuilderMatchPage() {
  const user = await getCurrentUser();
  const quota = await getQuotaState('builder-match', user?.id || null);

  // Restore the last run so a returning user sees their result immediately.
  let previous = null;
  if (user) {
    try {
      const row = await repo.latestQuizResult(user.id);
      if (row?.results?.matches?.length) {
        previous = {
          answers: row.answers || {},
          profileSummary: row.results.profileSummary || '',
          matches: row.results.matches,
          createdAt: row.createdAt,
        };
      }
    } catch (error) {
      console.error('[builder-match] previous result lookup failed:', error.message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Evaluate"
        title="Builder Match"
        icon={UserCheck}
        description="The highest-scoring opportunity is not automatically the right one for you. This ranks the feed against what you can actually execute, and tells you where you would struggle."
      />
      <MatchClient
        questions={builderQuestions}
        initialQuota={quota}
        previous={previous}
        isAuthed={Boolean(user)}
      />
    </>
  );
}
