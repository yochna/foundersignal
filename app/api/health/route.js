import { withApi } from '@/lib/api';
import { describeStore, repo } from '@/lib/db';
import {
  configSnapshot,
  hasGemini,
  hasNextAuthSecret,
  hasCronSecret,
  hasRedditAuth,
  hasGithubToken,
  isProd,
  quotas,
  gemini,
} from '@/lib/config';
import { authMode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Reports the tier each subsystem is running in, plus a `warnings` array the
 * status banner renders verbatim. It intentionally returns 200 even when
 * degraded: a fallback is a documented state, not an outage. `status` is only
 * "down" when a request genuinely cannot be served.
 *
 * No secrets, no key prefixes, nothing that could leak a credential.
 */
export const GET = withApi(async () => {
  const started = Date.now();
  const warnings = [];

  // --- store -----------------------------------------------------------------
  const store = await describeStore();

  let briefCount = null;
  let lastRun = null;
  try {
    briefCount = (await repo.listOpportunities()).length;
  } catch {
    briefCount = null;
  }
  try {
    lastRun = (await repo.listRuns(1))[0] || null;
  } catch {
    lastRun = null;
  }

  const dbFailedOver = store.configured === 'supabase' && Boolean(store.degraded);

  if (dbFailedOver) {
    warnings.push({
      code: 'DB_UNREACHABLE',
      level: 'warn',
      title: 'Supabase is not responding',
      detail:
        `Reads and writes are being served by the local store instead, so anything saved now will not appear in the database. Last failure: ${store.degraded.method} at ${store.degraded.at}.`,
    });
  } else if (store.driver === 'memory') {
    warnings.push({
      code: 'DB_MEMORY',
      level: 'warn',
      title: 'Storage is in memory only',
      detail:
        'The filesystem is not writable here, so watchlists and history disappear when the server restarts.',
    });
  } else if (isProd && store.configured !== 'supabase') {
    warnings.push({
      code: 'DB_FILE',
      level: 'info',
      title: 'Running on the local file store',
      detail:
        'Data persists to disk locally, but on a serverless host it is per-instance and temporary. Configure Supabase for durable storage.',
    });
  }

  // --- ai --------------------------------------------------------------------
  let spentToday = 0;
  try {
    spentToday = await repo.sumCostToday();
  } catch {
    spentToday = 0;
  }

  const budgetSpent = hasGemini && spentToday >= quotas.globalBudgetUsd;

  if (!hasGemini) {
    warnings.push({
      code: 'AI_UNCONFIGURED',
      level: 'info',
      title: 'No AI key is configured',
      detail:
        'Every AI feature still answers, using deterministic rule-based scoring. Results are labelled so nothing is passed off as model output.',
    });
  } else if (budgetSpent) {
    warnings.push({
      code: 'AI_BUDGET_SPENT',
      level: 'warn',
      title: "Today's shared AI budget is spent",
      detail:
        'Features are serving cached and deterministic results until the cap resets at 00:00 UTC.',
    });
  }

  // --- auth ------------------------------------------------------------------
  if (isProd && !hasNextAuthSecret) {
    warnings.push({
      code: 'AUTH_SECRET_MISSING',
      level: 'warn',
      title: 'NEXTAUTH_SECRET is not set',
      detail: 'Sessions are signed with a development fallback key. Set the secret before real use.',
    });
  }

  // --- sources ---------------------------------------------------------------
  if (isProd && !hasCronSecret) {
    warnings.push({
      code: 'CRON_UNCONFIGURED',
      level: 'info',
      title: 'Scheduled ingestion is disabled',
      detail: 'Set CRON_SECRET to let the daily cron refresh the feed automatically.',
    });
  }

  const config = configSnapshot();

  return {
    // Nothing above can make the app unserveable, so this is "ok" or "degraded".
    status: warnings.some((w) => w.level === 'warn') ? 'degraded' : 'ok',
    time: new Date().toISOString(),
    latencyMs: Date.now() - started,
    version: process.env.npm_package_version || '1.0.0',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    subsystems: {
      db: {
        driver: store.driver,
        configured: store.configured,
        reachable: !dbFailedOver && store.reachable !== false,
        writable: store.writable !== false,
        persistent: Boolean(store.persistent),
        briefCount,
        latencyMs: store.latencyMs ?? null,
      },
      ai: {
        configured: hasGemini,
        model: hasGemini ? gemini.model : null,
        mode: !hasGemini ? 'heuristic' : budgetSpent ? 'budget-exhausted' : 'live',
        spentTodayUsd: Number(spentToday.toFixed(6)),
        budgetUsd: quotas.globalBudgetUsd,
      },
      auth: {
        mode: authMode(),
        secretConfigured: hasNextAuthSecret,
        adminEmailsConfigured: config.auth.adminEmails,
      },
      sources: {
        reddit: hasRedditAuth ? 'oauth' : 'public',
        github: hasGithubToken ? 'token' : 'anonymous',
        rssFeeds: config.sources.rssFeeds,
      },
      ingestion: {
        cronConfigured: hasCronSecret,
        lastRun: lastRun
          ? {
              status: lastRun.status,
              startedAt: lastRun.startedAt,
              finishedAt: lastRun.finishedAt,
              signalsCount: lastRun.signalsCount,
              opportunitiesCount: lastRun.opportunitiesCount,
            }
          : null,
      },
    },
    quotas: config.quotas,
    warnings,
  };
});
