import { featureQuota, quotas } from '@/lib/config';
import { repo } from '@/lib/db';
import { AppError, ErrorCode } from '@/lib/errors';

/**
 * Free-tier protection.
 *
 * Two independent ceilings:
 *   1. Per-identity, per-feature daily count. Anonymous visitors get half the
 *      signed-in allowance, keyed on a cookie bucket.
 *   2. A global daily spend cap across all users, so one visitor cannot exhaust
 *      the shared demo key for everyone.
 *
 * Exceeding either does not error the request. The gateway catches the throw and
 * serves cached or heuristic output instead, labelled honestly.
 */

export function resetAtIso() {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

function limitFor(feature, isAnonymous, isPro = false) {
  const base = featureQuota[feature] ?? 5;
  if (isPro) return PRO_LIMIT;
  return isAnonymous ? Math.max(1, Math.floor(base / 2)) : base;
}

/** Reported allowance for Pro accounts. The global budget cap still applies. */
export const PRO_LIMIT = Number.MAX_SAFE_INTEGER;

/**
 * Check both ceilings for one identity/feature pair.
 * Returns a descriptor rather than throwing, so callers can decide.
 * Pro entitlement (server-verified) removes the per-user count ceiling; the
 * shared global budget cap always remains in force as a cost guard.
 */
export async function checkQuota({ feature, userId, isPro = false }) {
  const isAnonymous = !userId;
  const limit = limitFor(feature, isAnonymous, isPro);

  let used = 0;
  let spentToday = 0;

  try {
    [used, spentToday] = await Promise.all([
      repo.countUsageToday(userId || null, feature),
      repo.sumCostToday(),
    ]);
  } catch (error) {
    // If usage accounting is unavailable we allow the call rather than blocking
    // the product; the budget cap is a cost guard, not a correctness guard.
    console.error('[quota] usage lookup failed, allowing the request:', error.message);
    return {
      allowed: true,
      limit,
      used: 0,
      remaining: limit,
      resetAt: resetAtIso(),
      accountingDegraded: true,
    };
  }

  const budgetExceeded = spentToday >= quotas.globalBudgetUsd;
  const countExceeded = !isPro && used >= limit;

  return {
    allowed: !budgetExceeded && !countExceeded,
    reason: budgetExceeded ? 'budget' : countExceeded ? 'count' : null,
    limit,
    used,
    remaining: isPro ? PRO_LIMIT : Math.max(0, limit - used),
    resetAt: resetAtIso(),
    isAnonymous,
    isPro,
    unlimited: isPro,
    spentToday,
    budgetUsd: quotas.globalBudgetUsd,
  };
}

/** Build the AppError a route returns when the user explicitly asked for live AI. */
export function quotaError(state, feature) {
  if (state.reason === 'budget') {
    return new AppError(
      ErrorCode.BUDGET_EXCEEDED,
      'The shared daily AI budget for this demo has been spent',
      {
        hint: 'Deterministic scoring is still available, and the budget resets at 00:00 UTC.',
        meta: { resetAt: state.resetAt, spentToday: state.spentToday, budgetUsd: state.budgetUsd },
      }
    );
  }

  return new AppError(
    ErrorCode.QUOTA_EXCEEDED,
    `You have used all ${state.limit} free ${feature} runs for today`,
    {
      hint: state.isAnonymous
        ? 'Sign in to get the full daily allowance, or come back after 00:00 UTC.'
        : 'Your allowance resets at 00:00 UTC.',
      meta: { resetAt: state.resetAt, limit: state.limit, used: state.used },
    }
  );
}

/** Record an attempt. Never throws: accounting must not break a served response. */
export async function recordUsage(entry) {
  try {
    await repo.logUsage(entry);
  } catch (error) {
    console.error('[quota] could not record usage:', error.message);
  }
}
