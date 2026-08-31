import { cookies } from 'next/headers';
import { getSession, isAdminEmail } from '@/lib/auth';
import { repo } from '@/lib/db';

/**
 * Server-side entitlement.
 *
 * The single source of truth for "is this request allowed Pro access". Order of
 * precedence:
 *   1. Account tier from the NextAuth session (test2 / admin emails / isPro).
 *   2. Real subscription lookup: the plan Razorpay verification wrote to
 *      `users.plan` in /api/payments/verify. Durable across devices and a
 *      cleared cookie jar, and expires on its own (see plan_expires_at).
 *   3. The PRO_COOKIE/PLAN_COOKIE pair — now only ever set server-side, either
 *      by /api/payments/verify after a verified payment, or by
 *      /api/payments/demo-upgrade when Razorpay isn't configured. Kept as a
 *      fast path and as the only source for the file-store fallback.
 *   4. Free.
 */

export const PRO_COOKIE = 'fs_pro_user';
export const PLAN_COOKIE = 'fs_plan_type';

const PRO_PLAN_VALUES = ['starter', 'venture_pro'];

export function normalizePlan(value) {
  return PRO_PLAN_VALUES.includes(value) ? value : 'free';
}

export async function getEntitlement() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  const user = session?.user;
  const email = (user?.email || '').toLowerCase();

  if (user?.id) {
    const accountPro =
      user.isPro === true ||
      user.plan === 'venture_pro' ||
      email === 'test2@foundersignal.test' ||
      isAdminEmail(email);

    if (accountPro) {
      return { plan: 'venture_pro', isPro: true, source: 'account', userId: user.id };
    }

    try {
      const { plan: dbPlan, expiresAt } = await repo.getUserPlan(user.id);
      if (dbPlan && dbPlan !== 'free') {
        return { plan: dbPlan, isPro: true, source: 'subscription', userId: user.id, expiresAt };
      }
    } catch (error) {
      console.error('[entitlements] plan lookup failed, falling back to cookie:', error.message);
    }
  }

  try {
    const store = cookies();
    if (store.get(PRO_COOKIE)?.value === 'true') {
      const plan = normalizePlan(store.get(PLAN_COOKIE)?.value);
      return {
        plan: plan === 'free' ? 'venture_pro' : plan,
        isPro: true,
        source: 'cookie',
        userId: user?.id || null,
      };
    }
  } catch {
    // cookies() is unavailable outside a request scope; fall through to free.
  }

  return { plan: 'free', isPro: false, source: user?.id ? 'account' : 'anonymous', userId: user?.id || null };
}

export async function isProRequest() {
  const entitlement = await getEntitlement();
  return entitlement.isPro;
}
