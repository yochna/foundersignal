import { withApi, readJson } from '@/lib/api';
import { badRequest } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/track
 *
 * Deliberately outside the auth-protected route list in middleware.js: signed
 * out visitors are exactly who Web Analytics already counts, so the activity
 * log should count them too rather than only ever showing signed-in users.
 *
 * This is fire-and-forget from the client (see components/analytics/
 * activity-tracker.jsx) and never blocks or breaks the page it is called
 * from — a failure here is logged and swallowed, not surfaced to the visitor.
 */
export const POST = withApi(async (request) => {
  const body = await readJson(request);
  const event = typeof body.event === 'string' ? body.event.trim().slice(0, 64) : '';
  if (!event) throw badRequest('event is required');

  const path = typeof body.path === 'string' ? body.path.slice(0, 512) : null;
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null;

  // meta is caller-supplied and only ever rendered as text in the admin
  // panel, so cap its size rather than trust the client to behave.
  let meta = {};
  if (body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)) {
    meta = JSON.parse(JSON.stringify(body.meta).slice(0, 2000) || '{}');
  }

  const user = await getCurrentUser().catch(() => null);

  try {
    await repo.logActivity({ userId: user?.id || null, sessionId, event, path, meta });
  } catch (error) {
    // Never let a broken activity log take down the page that triggered it.
    console.warn('[api/track] logActivity failed:', error.message);
  }

  return {};
});
