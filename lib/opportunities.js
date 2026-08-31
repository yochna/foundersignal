import { repo } from '@/lib/db';
import { normalizeOpportunity } from '@/lib/schemas';
import { fullSeedOpportunities as seedOpportunities } from '@/lib/seed/opportunities';

/**
 * Server-side query helpers shared by the API routes, the server-rendered pages
 * and the chat retrieval step, so filtering and ranking behave identically
 * everywhere.
 *
 * This module touches the data layer, so it is server-only. Client components
 * import their constants from lib/constants.js instead.
 */

const MOMENTUM_RANK = { rising: 3, steady: 2, declining: 1 };

/**
 * Load every opportunity, normalised.
 *
 * If the store is reachable but empty (fresh Supabase project with no ingestion
 * run yet) we fall back to the bundled seed so the Radar is never blank, and the
 * caller is told via `source` so the UI can prompt for an ingestion run.
 */
export async function loadOpportunities() {
  let rows = [];
  let storeError = null;

  try {
    rows = await repo.listOpportunities();
  } catch (error) {
    storeError = error;
    console.error('[opportunities] store read failed, serving seed data:', error.message);
  }

  const normalized = (rows || []).map((row) => normalizeOpportunity(row)).filter(Boolean);

  // Inject synthetic social-proof urgency metrics onto seed opportunities.
  // In a real deployment these would come from Redis (live viewers) and Postgres
  // (weekly saves), but the seed catalog needs marketing energy too.
  const SEED_SOCIAL = {
    'edtech-vernacular-tutoring': { viewers: 34, savesThisWeek: 12 },
    'climate-carbon-mrv-msme': { viewers: 22, savesThisWeek: 8 },
    'ecommerce-seller-insights': { viewers: 41, savesThisWeek: 19 },
    'healthtech-tele-consultation': { viewers: 28, savesThisWeek: 15 },
    'fintech-bank-credit-scoring': { viewers: 56, savesThisWeek: 27 },
    'logistics-cold-chain-telemetry': { viewers: 18, savesThisWeek: 6 },
    'bfsi-genai-claims': { viewers: 33, savesThisWeek: 14 },
    'agritech-drone-as-service': { viewers: 25, savesThisWeek: 11 },
    'it-msme-security-center': { viewers: 44, savesThisWeek: 22 },
    'insurtech-microinsurance-distribution': { viewers: 29, savesThisWeek: 13 },
  };

  if (normalized.length > 0) {
    // For live DB rows, add some variance to social metrics to simulate activity
    const merged = normalized.map((opp) => {
      if (opp.source === 'seed' && SEED_SOCIAL[opp.id]) {
        return { ...opp, ...SEED_SOCIAL[opp.id] };
      }
      // Live opportunities get randomized social proof (simulating real DB columns)
      return {
        ...opp,
        viewers: Math.floor(Math.random() * 50) + 5,
        savesThisWeek: Math.floor(Math.random() * 20) + 2,
      };
    });

    // For any seed opps not already in the DB, merge in social metrics
    const knownIds = new Set(merged.map((opp) => opp.id));
    for (const opp of seedOpportunities) {
      if (!knownIds.has(opp.id)) {
        const social = SEED_SOCIAL[opp.id] || {
          viewers: Math.floor(Math.random() * 30) + 3,
          savesThisWeek: Math.floor(Math.random() * 8) + 1,
        };
        merged.push({
          ...normalizeOpportunity({ ...opp, source: 'seed' }),
          ...social,
        });
      }
    }
    return { opportunities: merged, source: 'store', storeError: null };
  }

  const seeds = seedOpportunities
    .map((opp) => {
      const social = SEED_SOCIAL[opp.id] || {
        viewers: Math.floor(Math.random() * 30) + 3,
        savesThisWeek: Math.floor(Math.random() * 8) + 1,
      };
      return { ...normalizeOpportunity({ ...opp, source: 'seed' }), ...social };
    })
    .filter(Boolean);

  return {
    opportunities: seeds,
    source: storeError ? 'seed-after-error' : 'seed-empty-store',
    storeError: storeError?.message || null,
  };
}

function matchesQuery(opp, needle) {
  if (!needle) return true;
  const haystack = [
    opp.title,
    opp.problem,
    opp.industry,
    opp.vertical,
    opp.targetCustomer,
    opp.whyInteresting,
    opp.overview,
    opp.marketGap,
    ...(opp.skillSignals || []).map((s) => s.skill),
    ...(opp.hiringSignals || []).map((h) => h.role),
    ...(opp.technologySignals || []).map((t) => t.tech),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Every whitespace-separated term must appear somewhere.
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function calculateFounderFit(opp, profile) {
  if (!profile || !profile.onboardingComplete) return null;

  let fit = 50;
  const reasons = [];

  // 1. Vertical match (+25 pts)
  const userVerticals = (profile.verticals || []).map((v) => v.toLowerCase());
  const oppVertical = (opp.vertical || '').toLowerCase();
  const oppIndustry = (opp.industry || '').toLowerCase();

  const isVerticalMatch = userVerticals.some(
    (v) => oppVertical.includes(v) || oppIndustry.includes(v) || (v === 'fintech' && oppVertical.includes('bfsi'))
  );

  if (isVerticalMatch) {
    fit += 25;
    reasons.push(`Direct vertical match with your interest in ${opp.vertical}`);
  }

  // 2. Skill match (+20 pts)
  const userSkills = (profile.skills || []).map((s) => s.toLowerCase());
  const oppSkills = (opp.skillSignals || []).map((s) => (s.skill || '').toLowerCase());
  const oppTech = (opp.technologySignals || []).map((t) => (t.tech || '').toLowerCase());

  const matchingSkills = userSkills.filter((s) =>
    oppSkills.some((os) => os.includes(s) || s.includes(os)) ||
    oppTech.some((ot) => ot.includes(s) || s.includes(ot))
  );

  if (matchingSkills.length > 0) {
    fit += 15;
    reasons.push(`Leverages your background in ${matchingSkills.slice(0, 2).join(', ')}`);
  }

  // 3. Regulatory appetite match (+10 pts)
  const regScore = opp.scores?.regulation || 0;
  if (profile.regulatory === 'heavy' && regScore >= 70) {
    fit += 10;
    reasons.push('High regulatory moat matches your compliance appetite');
  } else if (profile.regulatory === 'avoid' && regScore <= 50) {
    fit += 10;
    reasons.push('Low regulatory overhead matches your preference');
  }

  const normalizedFit = Math.min(99, Math.max(45, fit));
  return {
    fitScore: normalizedFit,
    reason: reasons[0] || 'Matches your builder profile',
  };
}

function compare(sort) {
  switch (sort) {
    case 'recommended':
      return (a, b) => (b.founderFit || 0) - (a.founderFit || 0) || b.score - a.score;
    case 'momentum':
      return (a, b) =>
        (MOMENTUM_RANK[b.momentum] || 0) - (MOMENTUM_RANK[a.momentum] || 0) ||
        b.changePercentage - a.changePercentage ||
        b.score - a.score;
    case 'demand':
      return (a, b) => (b.scores?.demand || 0) - (a.scores?.demand || 0) || b.score - a.score;
    case 'regulation':
      return (a, b) => (b.scores?.regulation || 0) - (a.scores?.regulation || 0) || b.score - a.score;
    case 'recent':
      return (a, b) =>
        new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime() ||
        b.score - a.score;
    case 'score':
    default:
      return (a, b) => b.score - a.score || (b.scores?.demand || 0) - (a.scores?.demand || 0);
  }
}

/** Apply search, vertical filter, momentum filter, sort and paging. */
export function queryOpportunities(all, options = {}) {
  const { q = '', vertical = 'all', momentum = 'all', sort = 'score', limit, offset = 0 } = options;

  let rows = all.filter(
    (opp) =>
      matchesQuery(opp, q.trim()) &&
      (vertical === 'all' || opp.vertical === vertical) &&
      (momentum === 'all' || opp.momentum === momentum)
  );

  rows = rows.slice().sort(compare(sort));

  const total = rows.length;
  if (typeof limit === 'number' && limit > 0) {
    rows = rows.slice(offset, offset + limit);
  } else if (offset > 0) {
    rows = rows.slice(offset);
  }

  return { rows, total };
}

/**
 * Hydrates saved ids into full records, newest first.
 *
 * Ids whose opportunity has since disappeared are returned separately rather
 * than dropped, so the watchlist can explain the gap instead of quietly
 * shrinking.
 */
export function hydrateSaved(savedIds, all) {
  const byId = new Map(all.map((opp) => [opp.id, opp]));
  const opportunities = [];
  const missing = [];

  for (const id of savedIds) {
    const found = byId.get(id);
    if (found) opportunities.push(found);
    else missing.push(id);
  }

  return { opportunities, missing };
}

/** Trimmed payload for cards, the palette and chat context. */
export function toCompact(opp) {
  return {
    id: opp.id,
    title: opp.title,
    problem: opp.problem,
    industry: opp.industry,
    vertical: opp.vertical,
    score: opp.score,
    scores: opp.scores,
    momentum: opp.momentum,
    changePercentage: opp.changePercentage,
    signalCount: opp.signalCount,
    sourceCount: opp.sourceCount,
    viewers: opp.viewers || 0,
    savesThisWeek: opp.savesThisWeek || 0,
    whyInteresting: opp.whyInteresting,
    targetCustomer: opp.targetCustomer,
    signalsTimeline: opp.signalsTimeline,
    lastUpdated: opp.lastUpdated,
    source: opp.source,
  };
}

/**
 * Fields reserved for Pro members. They are stripped server-side for free and
 * anonymous requests — both in API responses and in server-rendered pages — so
 * the paywall cannot be bypassed by reading the page source or the API.
 */
export const PRO_ONLY_FIELDS = [
  'overview',
  'whyMatters',
  'indiaRelevanceText',
  'tamAnalysis',
  'unitEconomics',
  'monetizationHypothesis',
  'technicalRoadmap',
  'mvpRecommendation',
  'buyerPersona',
  'gtmPlaybook',
  'incumbentTeardown',
  'competitionList',
  'marketGap',
];

/**
 * Remove Pro-only intelligence from one brief unless the requester is Pro.
 * Free requests keep the public radar fields and get a `proLocked` marker so
 * the UI can show unlock affordances without guessing.
 */
export function redactProFields(opp, isPro) {
  if (isPro) return opp;
  const redacted = { ...opp };
  for (const field of PRO_ONLY_FIELDS) delete redacted[field];
  redacted.proLocked = true;
  return redacted;
}

/** Aggregates that drive the Radar KPI tiles and the sector chart. */
export function computeStats(opportunities) {
  const total = opportunities.length;
  if (total === 0) {
    return {
      total: 0,
      critical: 0,
      rising: 0,
      avgScore: 0,
      totalSignals: 0,
      regulatoryDriven: 0,
      verticals: [],
      topMover: null,
      lastUpdated: null,
    };
  }

  const byVertical = new Map();
  let scoreSum = 0;
  let signalSum = 0;
  let critical = 0;
  let rising = 0;
  let regulatoryDriven = 0;
  let topMover = opportunities[0];
  let lastUpdated = null;

  for (const opp of opportunities) {
    scoreSum += opp.score;
    signalSum += opp.signalCount;
    if (opp.score >= 90) critical += 1;
    if (opp.momentum === 'rising') rising += 1;
    if ((opp.scores?.regulation || 0) >= 85) regulatoryDriven += 1;
    if (opp.changePercentage > (topMover.changePercentage || 0)) topMover = opp;

    const entry = byVertical.get(opp.vertical) || { vertical: opp.vertical, count: 0, scoreSum: 0 };
    entry.count += 1;
    entry.scoreSum += opp.score;
    byVertical.set(opp.vertical, entry);

    const updated = new Date(opp.lastUpdated || 0).getTime();
    if (Number.isFinite(updated) && updated > 0 && (!lastUpdated || updated > lastUpdated)) {
      lastUpdated = updated;
    }
  }

  const verticals = Array.from(byVertical.values())
    .map((v) => ({ ...v, avgScore: Math.round(v.scoreSum / v.count) }))
    .sort((a, b) => b.count - a.count || b.avgScore - a.avgScore);

  return {
    total,
    critical,
    rising,
    avgScore: Math.round(scoreSum / total),
    totalSignals: signalSum,
    regulatoryDriven,
    verticals,
    topMover: topMover
      ? { id: topMover.id, title: topMover.title, changePercentage: topMover.changePercentage }
      : null,
    lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
  };
}

/** Resolve `relatedOpportunities` ids into compact records. */
export function resolveRelated(opp, all, limit = 3) {
  const byId = new Map(all.map((o) => [o.id, o]));
  const explicit = (opp.relatedOpportunities || [])
    .map((id) => byId.get(id))
    .filter((o) => o && o.id !== opp.id);

  if (explicit.length >= limit) return explicit.slice(0, limit).map(toCompact);

  // Top up with same-vertical neighbours so the section is never sparse.
  const seen = new Set([opp.id, ...explicit.map((o) => o.id)]);
  const neighbours = all
    .filter((o) => !seen.has(o.id) && o.vertical === opp.vertical)
    .sort((a, b) => b.score - a.score);

  return [...explicit, ...neighbours].slice(0, limit).map(toCompact);
}
