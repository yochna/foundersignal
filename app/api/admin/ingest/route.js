import { withApi } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { runIngestion } from '@/lib/ingest/run';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';
// A full run makes one model call per cluster; the free-tier ceiling on Vercel
// is 60s, so the pipeline is sequential and bounded rather than parallel.
export const maxDuration = 60;

/** GET returns recent runs so the admin page can render history. */
export const GET = withApi(async () => {
  await requireAdmin();
  return { runs: await repo.listRuns(10) };
});

/** POST triggers a run. Admin-gated; the cron route has its own secret gate. */
export const POST = withApi(async () => {
  const user = await requireAdmin();
  const report = await runIngestion({ trigger: 'admin', triggeredBy: user.email || user.id });
  return { report };
});
