import { FileSearch } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { CareerClient } from '@/app/(app)/career-signal/career-client';
import { getQuotaState } from '@/lib/ai/gateway';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';
import { MAX_UPLOAD_BYTES, hasGemini } from '@/lib/config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Career Signal',
  description:
    'Upload or paste a resume to see how in demand your skill mix is, which skills to add next, and which opportunities you are already qualified to build.',
};

export default async function CareerSignalPage() {
  const user = await getCurrentUser();
  const quota = await getQuotaState('career-signal', user?.id || null);

  let previous = null;
  if (user) {
    try {
      const row = await repo.latestResumeProfile(user.id);
      if (row?.parsed?.skills) {
        previous = {
          fileName: row.fileName,
          result: row.parsed,
          createdAt: row.createdAt,
        };
      }
    } catch (error) {
      console.error('[career-signal] previous profile lookup failed:', error.message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Position"
        title="Career Signal"
        icon={FileSearch}
        description="Your resume, read against live demand signals. You get a demand score, the specific skills that would move it most, adjacent roles worth a jump, and the opportunities you could already build."
      />
      <CareerClient
        initialQuota={quota}
        previous={previous}
        isAuthed={Boolean(user)}
        pdfReadable={hasGemini}
        maxBytes={MAX_UPLOAD_BYTES}
      />
    </>
  );
}
