import { cookies } from 'next/headers';
import { withApi, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { hasLemonsqueezy } from '@/lib/config';
import { AppError, ErrorCode } from '@/lib/errors';
import { normalizePlan, PRO_COOKIE, PLAN_COOKIE } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

const YEAR_S = 365 * 24 * 60 * 60;

/**
 * Instant "Pro" grant with no real charge, for local dev / preview deploys
 * that have no Lemon Squeezy keys set. Locked out the moment Lemon Squeezy
 * is configured, so it can never be reached in a real, billable deployment.
 */
export const POST = withApi(async (request) => {
  if (hasLemonsqueezy) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Demo upgrade is disabled once Lemon Squeezy is configured', {
      hint: 'Use the real checkout flow.',
    });
  }
  await requireUser();
  const { plan } = await readJson(request);
  const resolvedPlan = normalizePlan(plan) === 'free' ? 'venture_pro' : plan;

  const jar = cookies();
  const cookieOptions = { path: '/', maxAge: YEAR_S, httpOnly: true, sameSite: 'lax' };
  jar.set(PRO_COOKIE, 'true', cookieOptions);
  jar.set(PLAN_COOKIE, resolvedPlan, cookieOptions);

  return { demo: true, plan: resolvedPlan };
});

export const DELETE = withApi(async () => {
  const jar = cookies();
  jar.set(PRO_COOKIE, '', { path: '/', maxAge: 0 });
  jar.set(PLAN_COOKIE, '', { path: '/', maxAge: 0 });
  return { demo: true, plan: 'free' };
});
