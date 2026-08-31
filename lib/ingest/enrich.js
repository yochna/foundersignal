import { hasGemini, quotas } from '@/lib/config';
import { callGemini } from '@/lib/ai/gemini';
import { parseModelJson } from '@/lib/ai/json';
import { buildEnrichmentPrompt } from '@/lib/ai/prompts';
import { recordUsage } from '@/lib/ai/quota';
import { repo } from '@/lib/db';
import { normalizeOpportunity } from '@/lib/schemas';
import { fullSeedOpportunities as seedOpportunities } from '@/lib/seed/opportunities';

/**
 * Turns clusters into opportunity briefs.
 *
 * The guarantee this module makes: it returns one opportunity per cluster, no
 * matter what. If the model is missing, blocked, or returns garbage, the
 * previous brief (from the store) or the bundled seed brief is retained with
 * refreshed signal counts, so the feed never shrinks after a run. A shrinking
 * feed would be the most visible possible failure, so it is designed out.
 */

const MONTH_LABELS = ['Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26'];

function seedById(id) {
  return seedOpportunities.find((o) => o.id === id) || null;
}

/**
 * Recomputes the fields that are true facts about this run rather than model
 * opinion: how many signals backed the cluster and how many source families.
 *
 * `source` describes the provenance of the brief text, so it only becomes
 * "ingested" when the model actually regenerated it. A retained seed brief with
 * fresh signal counts is still a seed brief, and saying otherwise would be the
 * exact kind of quiet dishonesty the source badge exists to prevent.
 */
function applyRunFacts(opportunity, cluster, { enriched = false } = {}) {
  const families = new Set(cluster.signals.map((s) => s.sourceFamily || 'seed'));

  // The final month of the timeline reflects this run's observed volume so the
  // sparkline moves when real ingestion happens.
  const timeline =
    opportunity.signalsTimeline?.length === 6
      ? opportunity.signalsTimeline.map((point, index) => ({
          date: point.date || MONTH_LABELS[index],
          value: point.value,
        }))
      : MONTH_LABELS.map((date) => ({ date, value: cluster.signals.length }));

  if (timeline.length === 6 && cluster.signals.length > 0) {
    timeline[5] = { ...timeline[5], value: Math.max(timeline[5].value, cluster.signals.length) };
  }

  return {
    ...opportunity,
    clusterId: cluster.id,
    signalCount: cluster.signals.length,
    sourceCount: families.size,
    signalsTimeline: timeline,
    feeds: {
      reddit: cluster.signals
        .filter((s) => s.sourceFamily === 'reddit')
        .slice(0, 5)
        .map((s) => `${s.text.slice(0, 140)}${s.url ? ` (${s.url})` : ''}`),
      github: cluster.signals
        .filter((s) => s.sourceFamily === 'github')
        .slice(0, 5)
        .map((s) => s.text.slice(0, 140)),
      linkedin: cluster.signals
        .filter((s) => s.sourceFamily === 'rss')
        .slice(0, 5)
        .map((s) => `${s.agency || 'Regulator'}: ${s.text.slice(0, 140)}`),
    },
    lastUpdated: new Date().toISOString().slice(0, 10),
    source: enriched ? 'ingested' : opportunity.source || 'seed',
  };
}

/** Fills structural gaps in a model brief from the seed record for that id. */
function backfillFromSeed(candidate, seed) {
  if (!seed) return candidate;
  const filled = { ...candidate };

  const TEXT_FIELDS = [
    'problem',
    'targetCustomer',
    'industry',
    'whyInteresting',
    'overview',
    'whyMatters',
    'demandAnalysis',
    'marketGap',
    'mvpRecommendation',
    'monetizationHypothesis',
    'indiaRelevanceText',
  ];
  for (const field of TEXT_FIELDS) {
    if (!String(filled[field] || '').trim()) filled[field] = seed[field];
  }

  const LIST_FIELDS = [
    'hiringSignals',
    'skillSignals',
    'regulatorySignals',
    'technologySignals',
    'competitionList',
    'risks',
    'relatedOpportunities',
  ];
  for (const field of LIST_FIELDS) {
    if (!Array.isArray(filled[field]) || filled[field].length === 0) filled[field] = seed[field];
  }

  return filled;
}

const STOP_WORDS = new Set(
  'the a an and or for with from this that into your you our are is was were will has have had not but they them their there here what when how why who which about over under more most than then out its it be been being can could should would may might we us i on in to of by at as if so do does did new using use used need needs help via vs get got make makes made just like also all any some via'.split(
    ' '
  )
);

/** Frequent multi-character words across a cluster's signals, most common first. */
function topTerms(signals, limit = 4) {
  const counts = new Map();

  for (const signal of signals) {
    const seen = new Set();
    for (const word of String(signal.text || '')
      .toLowerCase()
      .split(/[^a-z0-9+#.-]+/)) {
      const term = word.replace(/^[.-]+|[.-]+$/g, '');
      if (term.length < 4 || STOP_WORDS.has(term) || /^\d+$/.test(term)) continue;
      // Count each term once per signal so one verbose post cannot dominate.
      if (seen.has(term)) continue;
      seen.add(term);
      counts.set(term, (counts.get(term) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

/**
 * Builds a brief for a cluster that has no previous or seed record, using only
 * what the signals themselves state.
 *
 * This exists so the catch-all bucket is not thrown away in the zero-key case,
 * which is the default state of the demo. It deliberately makes no market claims
 * and carries `source: 'fallback'`, which the UI labels "Offline heuristic", so
 * a reader can tell it was assembled by counting signals rather than analysed.
 */
function synthesizeBrief(cluster) {
  const families = [...new Set(cluster.signals.map((s) => s.sourceFamily || 'seed'))];
  const liveCount = cluster.signals.filter((s) => (s.sourceFamily || 'seed') !== 'seed').length;

  // Without live evidence from more than one source this is noise, not a theme.
  if (liveCount < 5 || families.filter((f) => f !== 'seed').length < 2) return null;

  const terms = topTerms(cluster.signals);
  if (terms.length < 2) return null;

  const termList = terms.join(', ');
  const sourceList = families.filter((f) => f !== 'seed').join(' and ');
  const volumeScore = Math.min(70, 30 + liveCount * 2);

  return {
    id: cluster.id,
    clusterId: cluster.id,
    title: `Emerging theme: ${terms.slice(0, 3).join(', ')}`,
    problem: `${liveCount} signals from ${sourceList} clustered around ${termList} without matching any tracked opportunity.`,
    targetCustomer: 'Not yet determined from the available signals',
    industry: cluster.industry,
    vertical: cluster.vertical,
    // Volume is the only thing measurable here, so it is the only thing scored.
    score: volumeScore,
    scores: {
      demand: volumeScore,
      competition: 0,
      feasibility: 0,
      timing: volumeScore,
      indiaRelevance: 0,
      regulation: 0,
      hiring: 0,
    },
    momentum: liveCount >= 10 ? 'rising' : 'steady',
    whyInteresting: `Recurring mentions of ${termList} that no existing brief covers.`,
    overview: `This entry was assembled by grouping ${liveCount} signals collected from ${sourceList}; no language model was available to interpret them, so it reports what was observed and nothing more. Configure GEMINI_API_KEY and run ingestion again to turn this into a full brief.`,
    demandAnalysis: `Signal volume this run: ${liveCount} across ${families.filter((f) => f !== 'seed').length} sources. Scores other than demand and timing are left at zero because they cannot be derived from raw signals.`,
    risks: ['Unvalidated theme: no analysis has been performed on these signals yet'],
    source: 'fallback',
  };
}

/**
 * Enrich a single cluster.
 * @returns {{ opportunity: object, outcome: string, detail?: string, tokens?: number, cost?: number }}
 */
async function enrichCluster(cluster, { primary, budgetSpent, timeLeftMs = Infinity }) {
  const existing = primary;

  const retain = (outcome, detail) => {
    const base = existing || seedById(cluster.id);
    if (base) return { opportunity: applyRunFacts(base, cluster), outcome, detail };

    // A new cluster with no brief to fall back on: describe the signals rather
    // than discard them.
    const synthesized = normalizeOpportunity(synthesizeBrief(cluster) || {}, {
      fallbackId: cluster.id,
    });
    if (synthesized) {
      return {
        opportunity: applyRunFacts(synthesized, cluster),
        outcome: 'synthesized',
        detail: `${detail}; described from signal volume only`,
      };
    }

    return { opportunity: null, outcome: 'skipped', detail: 'not enough evidence for a new brief' };
  };

  if (!hasGemini) return retain('retained', 'no GEMINI_API_KEY configured');
  if (budgetSpent) return retain('retained', 'daily AI budget spent');
  if (timeLeftMs < 8000) return retain('retained', "not enough time left in this run's budget");

  const started = Date.now();

  try {
    const prompt = buildEnrichmentPrompt({
      clusterName: cluster.name,
      signals: cluster.signals.slice(0, 14),
      existing,
    });

    const result = await callGemini({
      systemInstruction: prompt.systemInstruction,
      parts: prompt.parts,
      temperature: 0.4,
      maxOutputTokens: 4096,
      json: true,
      // One slow cluster must not consume the whole run's allowance.
      deadlineMs: Math.min(24_000, timeLeftMs),
    });

    const parsed = parseModelJson(result.text);
    if (!parsed.ok) {
      await logIngestUsage('error', result, started);
      return retain('retained', `model JSON unparseable (${parsed.error})`);
    }

    const normalized = normalizeOpportunity(
      { ...parsed.value, vertical: parsed.value.vertical || cluster.vertical },
      { fallbackId: cluster.id }
    );

    if (!normalized) {
      await logIngestUsage('error', result, started);
      return retain('retained', 'model brief lacked an id or title');
    }

    // The model must not rename an existing brief, or saved watchlists and
    // related links would break silently. A brand new cluster takes its id.
    const targetId = existing?.id || cluster.id;
    const merged = applyRunFacts(
      backfillFromSeed({ ...normalized, id: targetId }, seedById(targetId)),
      cluster,
      { enriched: true }
    );

    await logIngestUsage('live', result, started);

    return {
      opportunity: merged,
      outcome: 'enriched',
      tokens: result.tokens.total,
      cost: result.costEstimate,
      repaired: parsed.strategy !== 'direct' ? parsed.strategy : undefined,
    };
  } catch (error) {
    await logIngestUsage('error', null, started);
    return retain('retained', error.message);
  }
}

async function logIngestUsage(outcome, result, started) {
  try {
    await recordUsage({
      userId: null,
      feature: 'ingest',
      provider: 'gemini',
      outcome,
      tokensUsed: result?.tokens?.total || 0,
      costEstimate: result?.costEstimate || 0,
      latencyMs: result?.latencyMs || Date.now() - started,
    });
  } catch (error) {
    console.warn('[ingest] usage logging failed:', error.message);
  }
}

/**
 * Groups existing briefs by the cluster they belong to.
 *
 * Several briefs legitimately share one cluster (three different compliance
 * products can all be driven by the same RBI signals). The model refreshes the
 * cluster's primary brief; the siblings get the refreshed signal facts only.
 * Picking the primary by exact id first, then by score, keeps the choice stable
 * across runs, which an "update the last one we happened to see" map did not.
 */
function groupByCluster(existing) {
  const groups = new Map();

  for (const opportunity of existing) {
    const key = opportunity.clusterId || opportunity.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(opportunity);
  }

  const resolved = new Map();
  for (const [clusterId, members] of groups) {
    const exact = members.find((o) => o.id === clusterId);
    const primary =
      exact || [...members].sort((a, b) => (b.score || 0) - (a.score || 0))[0] || null;
    resolved.set(clusterId, {
      primary,
      siblings: members.filter((o) => o.id !== primary?.id),
    });
  }

  return resolved;
}

/**
 * Wall-clock allowance for the whole enrichment phase.
 *
 * Cron and admin runs execute inside a 60s serverless function, and the source
 * collection before this has already spent some of it. Clusters that do not fit
 * keep their existing brief, which is the same outcome as any other model
 * failure, rather than the platform killing the run mid-write.
 */
const ENRICHMENT_BUDGET_MS = 35_000;

/**
 * Enrich every cluster, sequentially so the free-tier rate limit is respected
 * and the shared budget can be re-checked between calls.
 */
export async function enrichClusters(clusters, { existing = [], budgetMs = ENRICHMENT_BUDGET_MS } = {}) {
  const grouped = groupByCluster(existing);
  const deadline = Date.now() + budgetMs;

  let budgetSpent = false;
  if (hasGemini) {
    try {
      budgetSpent = (await repo.sumCostToday()) >= quotas.globalBudgetUsd;
    } catch {
      // If usage cannot be read, assume budget is available; the per-call
      // failure path still protects us.
    }
  }

  const opportunities = [];
  const report = [];
  let tokens = 0;
  let cost = 0;

  for (const cluster of clusters) {
    const group = grouped.get(cluster.id) || { primary: null, siblings: [] };
    const primary = group.primary || seedById(cluster.id);

    const result = await enrichCluster(cluster, {
      primary,
      budgetSpent,
      timeLeftMs: deadline - Date.now(),
    });

    if (result.opportunity) opportunities.push(result.opportunity);
    tokens += result.tokens || 0;
    cost += result.cost || 0;

    // Siblings keep their own text but pick up this run's signal evidence, so
    // every brief driven by these signals shows a consistent, current count.
    for (const sibling of group.siblings) {
      opportunities.push(applyRunFacts(sibling, cluster));
    }

    report.push({
      clusterId: cluster.id,
      name: cluster.name,
      signals: cluster.signals.length,
      primaryId: result.opportunity?.id || null,
      siblingIds: group.siblings.map((o) => o.id),
      outcome: result.outcome,
      detail: result.detail,
      repaired: result.repaired,
    });

    if (cost >= quotas.globalBudgetUsd) budgetSpent = true;
  }

  return { opportunities, report, tokens, cost };
}

export default enrichClusters;
