import { repo, describeStore } from '@/lib/db';
import { configSnapshot, quotas } from '@/lib/config';
import { authMode } from '@/lib/auth';
import { loadOpportunities, computeStats } from '@/lib/opportunities';
import { utcDayKey } from '@/lib/utils';

/**
 * Aggregation for the admin dashboard.
 *
 * Every number here is derived from stored rows rather than a mock array, which
 * is the whole point of the page: if the AI cost chart shows $0, that is because
 * no model call has been billed, not because the data is fake.
 *
 * Each lookup is individually guarded, so one unavailable table degrades a
 * single panel instead of the page.
 */

const FEATURE_LABELS = {
  'idea-validator': 'Idea Validator',
  'builder-match': 'Builder Match',
  'career-signal': 'Career Signal',
  chat: 'Copilot',
  ingest: 'Ingestion',
};

async function attempt(label, fn, fallback) {
  try {
    return { value: await fn(), error: null };
  } catch (error) {
    console.error(`[admin] ${label} failed:`, error.message);
    return { value: fallback, error: error.message };
  }
}

/** Groups usage rows into per-day, per-feature and per-outcome rollups. */
function rollupUsage(rows, days) {
  const today = utcDayKey();

  const byDay = new Map();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
    byDay.set(key, { day: key, calls: 0, live: 0, cached: 0, fallback: 0, blocked: 0, errors: 0, tokens: 0, cost: 0 });
  }

  const byFeature = new Map();
  const outcomes = { live: 0, cached: 0, fallback: 0, blocked: 0, error: 0 };

  let tokens = 0;
  let cost = 0;
  let costToday = 0;
  let latencyTotal = 0;
  let latencySamples = 0;

  for (const row of rows) {
    const day = row.dayKey || String(row.createdAt || '').slice(0, 10);
    const rowCost = Number(row.costEstimate) || 0;
    const rowTokens = Number(row.tokensUsed) || 0;

    tokens += rowTokens;
    cost += rowCost;
    if (day === today) costToday += rowCost;

    if (row.latencyMs > 0) {
      latencyTotal += row.latencyMs;
      latencySamples += 1;
    }

    if (outcomes[row.outcome] !== undefined) outcomes[row.outcome] += 1;

    const bucket = byDay.get(day);
    if (bucket) {
      bucket.calls += 1;
      bucket.tokens += rowTokens;
      bucket.cost += rowCost;
      if (row.outcome === 'error') bucket.errors += 1;
      else if (bucket[row.outcome] !== undefined) bucket[row.outcome] += 1;
    }

    if (!byFeature.has(row.feature)) {
      byFeature.set(row.feature, {
        feature: row.feature,
        label: FEATURE_LABELS[row.feature] || row.feature,
        calls: 0,
        live: 0,
        fallback: 0,
        tokens: 0,
        cost: 0,
      });
    }
    const featureRow = byFeature.get(row.feature);
    featureRow.calls += 1;
    featureRow.tokens += rowTokens;
    featureRow.cost += rowCost;
    if (row.outcome === 'live') featureRow.live += 1;
    if (row.outcome === 'fallback' || row.outcome === 'blocked') featureRow.fallback += 1;

    // A row with no user id is an anonymous visitor or a system job.
  }

  return {
    totalCalls: rows.length,
    outcomes,
    tokens,
    cost,
    costToday,
    budgetUsd: quotas.globalBudgetUsd,
    budgetUsedPct: quotas.globalBudgetUsd
      ? Math.min(100, Math.round((costToday / quotas.globalBudgetUsd) * 100))
      : 0,
    avgLatencyMs: latencySamples ? Math.round(latencyTotal / latencySamples) : 0,
    // Live share is the honest headline: how much of what users saw was a real
    // model answer rather than a deterministic fallback.
    liveSharePct: rows.length ? Math.round((outcomes.live / rows.length) * 100) : 0,
    daily: [...byDay.values()].map((d) => ({ ...d, cost: Number(d.cost.toFixed(6)) })),
    features: [...byFeature.values()]
      .map((f) => ({ ...f, cost: Number(f.cost.toFixed(6)) }))
      .sort((a, b) => b.calls - a.calls),
    uniqueUsers: new Set(rows.map((r) => r.userId).filter(Boolean)).size,
  };
}

/** Per-source health taken from the most recent run that recorded any. */
function sourceHealth(runs) {
  const latest = runs.find((run) => Array.isArray(run.sources) && run.sources.length > 0);
  if (!latest) return { asOf: null, sources: [] };

  return {
    asOf: latest.finishedAt || latest.startedAt,
    sources: latest.sources.map((source) => ({
      name: source.name,
      status: source.status || (source.ok ? 'ok' : 'failed'),
      items: source.items ?? 0,
      mode: source.mode || null,
      durationMs: source.durationMs ?? 0,
      error: source.error || null,
    })),
  };
}

export async function getAdminStats({ days = 7 } = {}) {
  const [runs, usage, store, users, savedTotal, validationsTotal, signals] = await Promise.all([
    attempt('listRuns', () => repo.listRuns(10), []),
    attempt('usageStats', () => repo.usageStats(days), []),
    attempt('describeStore', () => describeStore(), { driver: 'unknown' }),
    attempt('countUsers', () => repo.countUsers(), 0),
    attempt('countSavedTotal', () => repo.countSavedTotal(), 0),
    attempt('countValidationsTotal', () => repo.countValidationsTotal(), 0),
    attempt('listRawSignals', () => repo.listRawSignals(40), []),
  ]);

  const { opportunities, source } = await loadOpportunities();

  const errors = [runs, usage, store, users, savedTotal, validationsTotal, signals]
    .map((result) => result.error)
    .filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    days,
    config: configSnapshot(),
    authMode: authMode(),
    store: store.value,
    feed: {
      ...computeStats(opportunities),
      dataSource: source,
      ingestedCount: opportunities.filter((o) => o.source === 'ingested').length,
      seedCount: opportunities.filter((o) => o.source === 'seed').length,
    },
    engagement: {
      users: users.value,
      savedTotal: savedTotal.value,
      validationsTotal: validationsTotal.value,
    },
    runs: runs.value,
    lastRun: runs.value[0] || null,
    sourceHealth: sourceHealth(runs.value),
    usage: rollupUsage(usage.value, days),
    recentSignals: signals.value.slice(0, 20),
    partialErrors: errors,
  };
}

export default getAdminStats;
