import { repo } from '@/lib/db';
import { hasGemini, hasRedditAuth, hasGithubToken, rssFeeds } from '@/lib/config';
import { fetchRedditSignals } from '@/lib/ingest/sources/reddit';
import { fetchGithubSignals } from '@/lib/ingest/sources/github';
import { fetchRssSignals } from '@/lib/ingest/sources/rss';
import { fetchStackOverflowSignals } from '@/lib/ingest/sources/stackoverflow';
import { fetchHackerNewsSignals } from '@/lib/ingest/sources/hackernews';
import { fetchDevtoSignals } from '@/lib/ingest/sources/devto';
import { fetchReviewSignals } from '@/lib/ingest/sources/reviews';
import { fetchRegulatorySignals } from '@/lib/ingest/sources/regulatory';
import { fetchWorkforceSignals } from '@/lib/ingest/sources/workforce';
import { fetchLaunchSignals } from '@/lib/ingest/sources/launches';
import { fetchCommunitySignals } from '@/lib/ingest/sources/community';
import { fetchProductHuntSignals } from '@/lib/ingest/sources/producthunt';
import { fetchNewsSignals } from '@/lib/ingest/sources/news';
import { clusterSignals, summarizeClusters } from '@/lib/ingest/cluster';
import { enrichClusters } from '@/lib/ingest/enrich';
import { seedSignals } from '@/lib/seed/signals';

/**
 * Ingestion orchestrator.
 *
 * Contract: runIngestion() never throws. It always writes an ingestion_runs row
 * (running -> success | partial | failed) and always returns a report, because
 * the admin dashboard's usefulness depends on failed runs being visible rather
 * than silent.
 *
 * A run is:
 *   1. Collect from every source in parallel (each one self-contained).
 *   2. Merge with the seed corpus so clustering always has enough material.
 *   3. Cluster by weighted keywords.
 *   4. Enrich each cluster with Gemini, retaining the previous brief on failure.
 *   5. Upsert opportunities, replace raw signals, close the run row.
 */

/** Normalizes any connector item into the raw_signals shape. */
function toRawSignal(item) {
  return {
    source: item.source,
    sourceFamily: item.sourceFamily || 'seed',
    text: String(item.text || '').slice(0, 1200),
    url: item.url || null,
    publishedAt: item.publishedAt || null,
    engagement: Number(item.engagement) || 0,
    clusterId: item.clusterId || null,
  };
}

export async function runIngestion({ trigger = 'manual', triggeredBy = null } = {}) {
  const started = Date.now();

  let run = null;
  try {
    run = await repo.startRun();
  } catch (error) {
    // Without a run row we still do the work; the report is returned to the
    // caller even if it cannot be persisted.
    console.error('[ingest] could not create run row:', error.message);
  }

  const log = [];
  const say = (line) => {
    log.push(line);
    console.log(`[ingest] ${line}`);
  };

  say(`run started (trigger: ${trigger}${triggeredBy ? `, by ${triggeredBy}` : ''})`);

  try {
    // --- 1. Collect across 6 evidence categories -----------------------------
    const settled = await Promise.allSettled([
      fetchRedditSignals(),
      fetchGithubSignals(),
      fetchStackOverflowSignals(),
      fetchHackerNewsSignals(),
      fetchDevtoSignals(),
      fetchReviewSignals(),
      fetchRegulatorySignals(),
      fetchWorkforceSignals(),
      fetchLaunchSignals(),
      fetchCommunitySignals(),
      fetchProductHuntSignals(),
      fetchNewsSignals(),
      fetchRssSignals(),
    ]);

    const names = [
      'reddit',
      'github',
      'stackoverflow',
      'hackernews',
      'devto',
      'reviews',
      'regulatory',
      'workforce',
      'launches',
      'community',
      'producthunt',
      'news',
      'rss',
    ];
    const sources = settled.map((result, index) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            name: names[index],
            category: 'other',
            tier: 'tier_b',
            ok: false,
            items: [],
            status: 'failed',
            error: result.reason?.message || 'connector threw',
            durationMs: 0,
          }
    );

    for (const source of sources) {
      say(
        `${source.name}: ${source.status} (${source.items.length} items, ${source.durationMs}ms)${
          source.error ? ` - ${source.error}` : ''
        }`
      );
    }

    const liveItems = sources.flatMap((source) => source.items);

    // --- 2. Merge with the seed corpus ---------------------------------------
    // Seeds are always included. Their purpose is to guarantee that every
    // cluster has enough material to produce a brief even when the network is
    // unavailable, which is what keeps a zero-key demo honest but complete.
    const allSignals = [
      ...liveItems.map(toRawSignal),
      ...seedSignals.map((s) => toRawSignal({ ...s, sourceFamily: 'seed' })),
    ];

    say(`collected ${liveItems.length} live signals plus ${seedSignals.length} baseline signals`);

    // --- 3. Cluster ----------------------------------------------------------
    const clusters = clusterSignals(allSignals);
    say(
      `clustered into ${clusters.length} themes: ${clusters
        .map((c) => `${c.id}(${c.signals.length})`)
        .join(', ')}`
    );

    if (clusters.length === 0) {
      throw new Error('clustering produced no themes, which should be impossible with seeds present');
    }

    // --- 4. Enrich -----------------------------------------------------------
    let existing = [];
    try {
      existing = await repo.listOpportunities();
    } catch (error) {
      say(`could not read existing opportunities (${error.message}); enriching from seeds`);
    }

    const enrichment = await enrichClusters(clusters, { existing });

    for (const entry of enrichment.report) {
      say(
        `${entry.clusterId}: ${entry.outcome}${entry.detail ? ` - ${entry.detail}` : ''}${
          entry.repaired ? ` (json repaired via ${entry.repaired})` : ''
        }`
      );
    }

    const enrichedCount = enrichment.report.filter((r) => r.outcome === 'enriched').length;
    say(
      `enriched ${enrichedCount}/${clusters.length} clusters with the model, ${
        enrichment.report.length - enrichedCount
      } retained`
    );

    // --- 5. Persist ----------------------------------------------------------
    let written = 0;
    let writeError = null;
    try {
      written = await repo.upsertOpportunities(enrichment.opportunities);
      say(`upserted ${written} opportunities`);
    } catch (error) {
      writeError = error.message;
      say(`opportunity write failed: ${error.message}`);
    }

    // Raw signals are tagged with their cluster before storage so the admin view
    // can show what actually drove each brief.
    const taggedSignals = clusters.flatMap((cluster) =>
      cluster.signals.map((signal) => toRawSignal({ ...signal, clusterId: cluster.id }))
    );

    try {
      const count = await repo.replaceRawSignals(taggedSignals.slice(0, 500));
      say(`stored ${count} raw signals`);
    } catch (error) {
      say(`raw signal write failed: ${error.message}`);
    }

    const sourceHealth = sources.map((source) => ({
      name: source.name,
      category: source.category || 'other',
      tier: source.tier || 'tier_b',
      status: source.status,
      mode: source.mode,
      items: source.items.length,
      durationMs: source.durationMs,
      error: source.error,
    }));

    // Live sources failing is expected on a free tier, so the run is only
    // "failed" when nothing could be written at all.
    const liveSourceOk = sources.some((s) => s.ok);
    const status = writeError ? 'failed' : liveSourceOk && enrichedCount > 0 ? 'success' : 'partial';

    const summary = {
      status,
      trigger,
      triggeredBy,
      signalsCount: allSignals.length,
      liveSignalsCount: liveItems.length,
      opportunitiesCount: written || enrichment.opportunities.length,
      clusters: summarizeClusters(clusters),
      sources: sourceHealth,
      enrichment: enrichment.report,
      tokensUsed: enrichment.tokens,
      costEstimate: Number(enrichment.cost.toFixed(6)),
      aiEnabled: hasGemini,
      credentials: {
        redditAuth: hasRedditAuth,
        githubToken: hasGithubToken,
        rssFeeds: rssFeeds.length,
      },
      durationMs: Date.now() - started,
      error: writeError,
      log,
    };

    if (run) {
      try {
        await repo.finishRun(run.id, {
          status,
          signalsCount: summary.signalsCount,
          opportunitiesCount: summary.opportunitiesCount,
          sources: sourceHealth,
          error: writeError,
          finishedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[ingest] could not close run row:', error.message);
      }
    }

    say(`run ${status} in ${summary.durationMs}ms`);
    return { ok: status !== 'failed', runId: run?.id || null, ...summary };
  } catch (error) {
    console.error('[ingest] run failed:', error);

    if (run) {
      try {
        await repo.finishRun(run.id, {
          status: 'failed',
          error: error.message,
          finishedAt: new Date().toISOString(),
        });
      } catch (closeError) {
        console.error('[ingest] could not close failed run row:', closeError.message);
      }
    }

    return {
      ok: false,
      runId: run?.id || null,
      status: 'failed',
      trigger,
      signalsCount: 0,
      opportunitiesCount: 0,
      sources: [],
      error: error.message,
      durationMs: Date.now() - started,
      log: [...log, `run failed: ${error.message}`],
    };
  }
}

export default runIngestion;
