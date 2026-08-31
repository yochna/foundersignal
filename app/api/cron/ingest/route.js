import { withApi } from '@/lib/api';
import { AppError, ErrorCode } from '@/lib/errors';
import { cronSecret, hasCronSecret, isProd } from '@/lib/config';
import { runIngestion } from '@/lib/ingest/run';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Scheduled ingestion entry point, registered in vercel.json.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. A manual curl can
 * instead pass `?secret=`. In production the secret is mandatory, otherwise
 * anyone could burn the shared AI budget by hitting this URL in a loop. Locally
 * it is optional so the schedule can be tested without extra setup.
 */
function assertAuthorized(request) {
  if (!hasCronSecret) {
    if (isProd) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Scheduled ingestion is not configured', {
        hint: 'Set CRON_SECRET in the deployment environment to enable the cron endpoint.',
      });
    }
    return 'unsecured-dev';
  }

  const header = request.headers.get('authorization') || '';
  if (header === `Bearer ${cronSecret}`) return 'bearer';

  const url = new URL(request.url);
  if (url.searchParams.get('secret') === cronSecret) return 'query-secret';

  throw new AppError(ErrorCode.FORBIDDEN, 'Invalid cron credentials', {
    hint: 'Send Authorization: Bearer <CRON_SECRET>.',
  });
}

async function handle(request) {
  const auth = assertAuthorized(request);
  const report = await runIngestion({ trigger: 'cron', triggeredBy: auth });

  // The report is returned even for a partial or failed run so the Vercel cron
  // log shows what happened rather than an opaque status code.
  return { report };
}

export const GET = withApi(handle);
export const POST = withApi(handle);
