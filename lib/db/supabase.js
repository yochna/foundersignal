if (process.env.NODE_ENV !== 'production' && typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseConfig } from '@/lib/config';
import { utcDayKey } from '@/lib/utils';

/**
 * Postgres-backed driver.
 *
 * Uses the service-role key, so every call here runs server-side only and
 * bypasses RLS by design. RLS in 001_schema.sql protects the anon key path,
 * which is what a browser would ever hold.
 *
 * Row shapes are snake_case in Postgres and camelCase in the app, so each
 * method maps explicitly rather than leaking column names into the UI.
 */

let client = null;

/**
 * A paused or firewalled project otherwise holds the connection open until the
 * platform's own timeout, which would stall page renders behind it.
 */
const QUERY_TIMEOUT_MS = 6000;

function timeoutFetch(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

  if (init.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return fetch(url, { ...init, signal: controller.signal })
    .catch((error) => {
      if (error?.name === 'AbortError') {
        throw new Error(`Supabase did not respond within ${QUERY_TIMEOUT_MS}ms`);
      }
      throw error;
    })
    .finally(() => clearTimeout(timer));
}

function db() {
  if (!client) {
    client = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'foundersignal' }, fetch: timeoutFetch },
    });
  }
  return client;
}

/**
 * Runs a write that references public.users, repairing a missing parent row.
 *
 * Sign-in mirrors the user into our users table, but if Supabase was
 * unreachable at that moment the upsert landed in the local store instead and
 * is never replayed. Every later write for that user then fails with 23503
 * (foreign key violation), which trips the circuit breaker and silently
 * downgrades an otherwise healthy database. Recreating the row from the id we
 * already hold is cheaper and less surprising than losing the write; the next
 * sign-in fills in the name and email.
 */
async function withUserRow(userId, run, context) {
  const result = await run();
  if (!userId || result?.error?.code !== '23503') return result;

  console.warn(`[db:supabase] ${context}: user ${userId} had no row, recreating it`);
  const repair = await db().from('users').upsert({ id: userId }, { onConflict: 'id' });
  if (repair.error) return result;

  return run();
}

/** Supabase returns `{ data, error }`; make errors throw so withApi maps them. */
function unwrap(result, context) {
  if (result.error) {
    const error = new Error(`${context}: ${result.error.message}`);
    error.cause = result.error;
    error.supabaseCode = result.error.code;
    throw error;
  }
  return result.data;
}

function toOpportunity(row) {
  if (!row) return null;
  return {
    id: row.id,
    clusterId: row.cluster_id || row.id,
    title: row.title,
    problem: row.problem || '',
    targetCustomer: row.target_customer || '',
    industry: row.industry || '',
    vertical: row.vertical || 'IT',
    score: row.score ?? 0,
    scores: row.scores_json || {},
    momentum: row.momentum || 'steady',
    changePercentage: row.change_percentage ?? 0,
    signalCount: row.signal_count ?? 0,
    sourceCount: row.source_count ?? 0,
    whyInteresting: row.why_interesting || '',
    overview: row.overview || '',
    whyMatters: row.why_matters || '',
    demandAnalysis: row.demand_analysis || '',
    signalsTimeline: row.signals_timeline_json || [],
    hiringSignals: row.hiring_signals_json || [],
    skillSignals: row.skill_signals_json || [],
    regulatorySignals: row.regulatory_signals_json || [],
    technologySignals: row.technology_signals_json || [],
    competitionList: row.competition_list_json || [],
    marketGap: row.market_gap || '',
    mvpRecommendation: row.mvp_recommendation || '',
    monetizationHypothesis: row.monetization_hypothesis || '',
    risks: row.risks_json || [],
    indiaRelevanceText: row.india_relevance_text || '',
    relatedOpportunities: row.related_opportunities_json || [],
    feeds: row.feeds_json || { reddit: [], github: [], linkedin: [] },
    lastUpdated: row.last_updated || '',
    source: row.source || 'ingested',
    createdAt: row.created_at,
  };
}

function fromOpportunity(opp) {
  return {
    id: opp.id,
    cluster_id: opp.clusterId || opp.id,
    title: opp.title,
    problem: opp.problem,
    target_customer: opp.targetCustomer,
    industry: opp.industry,
    vertical: opp.vertical,
    score: opp.score,
    scores_json: opp.scores,
    momentum: opp.momentum,
    change_percentage: opp.changePercentage,
    signal_count: opp.signalCount,
    source_count: opp.sourceCount,
    why_interesting: opp.whyInteresting,
    overview: opp.overview,
    why_matters: opp.whyMatters,
    demand_analysis: opp.demandAnalysis,
    signals_timeline_json: opp.signalsTimeline,
    hiring_signals_json: opp.hiringSignals,
    skill_signals_json: opp.skillSignals,
    regulatory_signals_json: opp.regulatorySignals,
    technology_signals_json: opp.technologySignals,
    competition_list_json: opp.competitionList,
    market_gap: opp.marketGap,
    mvp_recommendation: opp.mvpRecommendation,
    monetization_hypothesis: opp.monetizationHypothesis,
    risks_json: opp.risks,
    india_relevance_text: opp.indiaRelevanceText,
    related_opportunities_json: opp.relatedOpportunities,
    feeds_json: opp.feeds,
    last_updated: opp.lastUpdated,
    source: opp.source || 'ingested',
  };
}

function toProfile(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    displayName: row.display_name || '',
    headline: row.headline || '',
    bio: row.bio || '',
    location: row.location || '',
    roleTitle: row.role_title || '',
    company: row.company || '',
    experienceYears: row.experience_years ?? 0,
    builderStage: row.builder_stage || 'exploring',
    weeklyHours: row.weekly_hours ?? 0,
    skills: row.skills_json || [],
    interests: row.interests_json || [],
    verticals: row.verticals_json || [],
    lookingFor: row.looking_for || '',
    websiteUrl: row.website_url || '',
    githubUrl: row.github_url || '',
    linkedinUrl: row.linkedin_url || '',
    twitterUrl: row.twitter_url || '',
    visibility: row.visibility || 'public',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Onboarding answers live in one JSON blob and are lifted here so callers
    // keep seeing flat fields (city, role, capital, onboardingComplete...).
    ...(row.onboarding_json || {}),
  };
}

/** Only writes the keys the caller supplied, so a partial patch stays partial. */
function fromProfile(profile) {
  const columns = {
    displayName: 'display_name',
    headline: 'headline',
    bio: 'bio',
    location: 'location',
    roleTitle: 'role_title',
    company: 'company',
    experienceYears: 'experience_years',
    builderStage: 'builder_stage',
    weeklyHours: 'weekly_hours',
    skills: 'skills_json',
    interests: 'interests_json',
    verticals: 'verticals_json',
    lookingFor: 'looking_for',
    websiteUrl: 'website_url',
    githubUrl: 'github_url',
    linkedinUrl: 'linkedin_url',
    twitterUrl: 'twitter_url',
    visibility: 'visibility',
  };

  // Onboarding answers have no dedicated columns, so they are bundled into one
  // JSON blob (onboarding_json). Only written when at least one such key is
  // present, so a partial profile edit never wipes the stored answers.
  const onboardingKeys = ['role', 'city', 'capital', 'regulatory', 'onboardingComplete'];

  const row = {};
  for (const [key, column] of Object.entries(columns)) {
    if (profile[key] !== undefined) row[column] = profile[key];
  }

  const onboarding = {};
  for (const key of onboardingKeys) {
    if (profile[key] !== undefined) onboarding[key] = profile[key];
  }
  if (Object.keys(onboarding).length) row.onboarding_json = onboarding;

  return row;
}

function toPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body || '',
    topic: row.topic || 'general',
    tags: row.tags_json || [],
    linkUrl: row.link_url || '',
    opportunityId: row.opportunity_id || null,
    pinned: Boolean(row.pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toComment(row) {
  if (!row) return null;
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id || null,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRoadmap(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    inputKind: row.input_kind,
    inputText: row.input_text,
    horizon: row.horizon,
    title: row.title || '',
    result: row.result_json || {},
    createdAt: row.created_at,
  };
}

export function createSupabaseDriver() {
  return {
    name: 'supabase',

    async describe() {
      // A trivial query doubles as a reachability probe for /api/health.
      const started = Date.now();
      const result = await db().from('opportunities').select('id', { count: 'exact', head: true });
      if (result.error) {
        return {
          driver: 'supabase',
          writable: false,
          reachable: false,
          error: result.error.message,
          latencyMs: Date.now() - started,
        };
      }
      return {
        driver: 'supabase',
        writable: true,
        reachable: true,
        persistent: true,
        rows: result.count ?? 0,
        latencyMs: Date.now() - started,
      };
    },

    // --- opportunities ------------------------------------------------------
    async listOpportunities() {
      const rows = unwrap(
        await db().from('opportunities').select('*').order('score', { ascending: false }),
        'listOpportunities'
      );
      return (rows || []).map(toOpportunity);
    },

    async getOpportunity(id) {
      const rows = unwrap(
        await db().from('opportunities').select('*').eq('id', id).limit(1),
        'getOpportunity'
      );
      return rows?.length ? toOpportunity(rows[0]) : null;
    },

    async upsertOpportunities(opportunities) {
      if (!opportunities.length) return 0;
      unwrap(
        await db().from('opportunities').upsert(opportunities.map(fromOpportunity), { onConflict: 'id' }),
        'upsertOpportunities'
      );
      return opportunities.length;
    },

    // --- users --------------------------------------------------------------
    async upsertUser(user) {
      const rows = unwrap(
        await db()
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email || null,
              name: user.name || null,
              image: user.image || null,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select(),
        'upsertUser'
      );
      return rows?.[0] || null;
    },

    async countUsers() {
      const result = await db().from('users').select('id', { count: 'exact', head: true });
      return result.count ?? 0;
    },

    // --- billing --------------------------------------------------------------
    async getUserPlan(userId) {
      const rows = unwrap(
        await db().from('users').select('plan, plan_expires_at').eq('id', userId).limit(1),
        'getUserPlan'
      );
      const row = rows?.[0];
      if (!row) return { plan: 'free', expiresAt: null };
      if (row.plan !== 'free' && row.plan_expires_at && Date.parse(row.plan_expires_at) < Date.now()) {
        return { plan: 'free', expiresAt: row.plan_expires_at };
      }
      return { plan: row.plan || 'free', expiresAt: row.plan_expires_at || null };
    },

    async setUserPlan(userId, { plan, expiresAt }) {
      unwrap(
        await db().from('users').update({ plan, plan_expires_at: expiresAt }).eq('id', userId),
        'setUserPlan'
      );
      return { plan, expiresAt };
    },

    async createPaymentOrder(order) {
      unwrap(
        await db().from('payments').insert({
          id: order.id,
          user_id: order.userId,
          plan: order.plan,
          amount_paise: order.amountPaise,
          currency: order.currency,
          status: 'created',
        }),
        'createPaymentOrder'
      );
      return order;
    },

    async markPaymentCaptured(orderId, razorpayPaymentId) {
      unwrap(
        await db()
          .from('payments')
          .update({ status: 'captured', razorpay_payment_id: razorpayPaymentId, captured_at: new Date().toISOString() })
          .eq('id', orderId),
        'markPaymentCaptured'
      );
    },

    async getPaymentOrder(orderId) {
      const rows = unwrap(
        await db().from('payments').select('*').eq('id', orderId).limit(1),
        'getPaymentOrder'
      );
      const row = rows?.[0];
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        plan: row.plan,
        amountPaise: row.amount_paise,
        currency: row.currency,
        status: row.status,
        razorpayPaymentId: row.razorpay_payment_id,
      };
    },

    async listUsersByIds(ids) {
      if (!ids.length) return [];
      const rows = unwrap(
        await db().from('users').select('id, name, email, image, created_at').in('id', ids),
        'listUsersByIds'
      );
      return (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        image: r.image,
        createdAt: r.created_at,
      }));
    },

    // --- saved --------------------------------------------------------------
    async listSaved(userId) {
      const rows = unwrap(
        await db()
          .from('saved_opportunities')
          .select('opportunity_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        'listSaved'
      );
      return (rows || []).map((r) => r.opportunity_id);
    },

    async isSaved(userId, opportunityId) {
      const rows = unwrap(
        await db()
          .from('saved_opportunities')
          .select('opportunity_id')
          .eq('user_id', userId)
          .eq('opportunity_id', opportunityId)
          .limit(1),
        'isSaved'
      );
      return Boolean(rows?.length);
    },

    async addSaved(userId, opportunityId) {
      unwrap(
        await withUserRow(
          userId,
          () =>
            db()
              .from('saved_opportunities')
              .upsert(
                { user_id: userId, opportunity_id: opportunityId },
                { onConflict: 'user_id,opportunity_id' }
              ),
          'addSaved'
        ),
        'addSaved'
      );
      return true;
    },

    async removeSaved(userId, opportunityId) {
      unwrap(
        await db()
          .from('saved_opportunities')
          .delete()
          .eq('user_id', userId)
          .eq('opportunity_id', opportunityId),
        'removeSaved'
      );
      return true;
    },

    async countSavedTotal() {
      const result = await db().from('saved_opportunities').select('user_id', { count: 'exact', head: true });
      return result.count ?? 0;
    },

    // --- feature records ----------------------------------------------------
    async saveQuizResult(userId, answers, results) {
      const rows = unwrap(
        await withUserRow(
          userId,
          () =>
            db()
              .from('quiz_results')
              .insert({ user_id: userId, answers_json: answers, results_json: results })
              .select(),
          'saveQuizResult'
        ),
        'saveQuizResult'
      );
      return rows?.[0] || null;
    },

    async latestQuizResult(userId) {
      const rows = unwrap(
        await db()
          .from('quiz_results')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1),
        'latestQuizResult'
      );
      const row = rows?.[0];
      return row
        ? { id: row.id, answers: row.answers_json, results: row.results_json, createdAt: row.created_at }
        : null;
    },

    async saveResumeProfile(userId, fileName, parsed, demandScore) {
      const rows = unwrap(
        await withUserRow(
          userId,
          () =>
            db()
              .from('resume_profiles')
              .insert({
                user_id: userId,
                file_name: fileName,
                parsed_json: parsed,
                demand_score: demandScore,
              })
              .select(),
          'saveResumeProfile'
        ),
        'saveResumeProfile'
      );
      return rows?.[0] || null;
    },

    async latestResumeProfile(userId) {
      const rows = unwrap(
        await db()
          .from('resume_profiles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1),
        'latestResumeProfile'
      );
      const row = rows?.[0];
      return row
        ? {
            id: row.id,
            fileName: row.file_name,
            parsed: row.parsed_json,
            demandScore: row.demand_score,
            createdAt: row.created_at,
          }
        : null;
    },

    async saveValidation(userId, ideaText, result, validationScore) {
      const rows = unwrap(
        await withUserRow(
          userId,
          () =>
            db()
              .from('idea_validations')
              .insert({
                user_id: userId,
                idea_text: ideaText,
                result_json: result,
                validation_score: validationScore,
              })
              .select(),
          'saveValidation'
        ),
        'saveValidation'
      );
      return rows?.[0] || null;
    },

    async listValidations(userId, limit = 10) {
      const rows = unwrap(
        await db()
          .from('idea_validations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        'listValidations'
      );
      return (rows || []).map((row) => ({
        id: row.id,
        ideaText: row.idea_text,
        result: row.result_json,
        validationScore: row.validation_score,
        createdAt: row.created_at,
      }));
    },
    async listValidationsAdmin(limit = 100) {
  const rows = unwrap(
    await db()
      .from('idea_validations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
    'listValidationsAdmin'
  );

  return (rows || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    ideaText: row.idea_text,
    result: row.result_json,
    validationScore: row.validation_score,
    createdAt: row.created_at,
  }));
},

    async countValidationsTotal() {
      const result = await db().from('idea_validations').select('id', { count: 'exact', head: true });
      return result.count ?? 0;
    },

    // --- activity log ---------------------------------------------------------
    async logActivity({ userId = null, sessionId = null, event, path: eventPath = null, meta = {} }) {
      const rows = unwrap(
        await withUserRow(
          userId,
          () =>
            db()
              .from('user_activity')
              .insert({
                user_id: userId,
                session_id: sessionId,
                event,
                path: eventPath,
                meta_json: meta || {},
              })
              .select(),
          'logActivity'
        ),
        'logActivity'
      );
      return rows?.[0] || null;
    },

    async listRecentActivity(limit = 100) {
      const rows = unwrap(
        await db()
          .from('user_activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit),
        'listRecentActivity'
      );
      return (rows || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        event: row.event,
        path: row.path,
        meta: row.meta_json,
        createdAt: row.created_at,
      }));
    },

    async activityStats(days = 7) {
      const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
      const rows = unwrap(
        await db()
          .from('user_activity')
          .select('user_id, session_id, path, created_at')
          .gte('created_at', sinceIso),
        'activityStats'
      );
      const list = rows || [];
      const uniqueUsers = new Set(
        list.map((r) => r.user_id || r.session_id).filter(Boolean)
      ).size;
      const byPath = new Map();
      for (const row of list) {
        const key = row.path || '(unknown)';
        byPath.set(key, (byPath.get(key) || 0) + 1);
      }
      const topPaths = [...byPath.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([path, count]) => ({ path, count }));
      return { total: list.length, uniqueUsers, topPaths };
    },

    // --- chat ---------------------------------------------------------------
    async appendChat(userId, role, content) {
      const rows = unwrap(
        await withUserRow(
          userId,
          () => db().from('chat_messages').insert({ user_id: userId, role, content }).select(),
          'appendChat'
        ),
        'appendChat'
      );
      return rows?.[0] || null;
    },

    async listChat(userId, limit = 40) {
      const rows = unwrap(
        await db()
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(limit),
        'listChat'
      );
      return (rows || []).map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        createdAt: r.created_at,
      }));
    },

    async clearChat(userId) {
      unwrap(await db().from('chat_messages').delete().eq('user_id', userId), 'clearChat');
      return true;
    },

    // --- signals ------------------------------------------------------------
    async replaceRawSignals(signals) {
      if (!signals.length) return 0;
      // Keep only the newest window so the demo table cannot grow without bound.
      unwrap(
        await db().from('raw_signals').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        'clearRawSignals'
      );
      unwrap(
        await db()
          .from('raw_signals')
          .insert(
            signals.map((s) => ({
              source: s.source,
              text: s.text,
              url: s.url || null,
              cluster_id: s.clusterId || null,
              published_at: s.publishedAt || null,
            }))
          ),
        'replaceRawSignals'
      );
      return signals.length;
    },

    async listRawSignals(limit = 200) {
      const rows = unwrap(
        await db()
          .from('raw_signals')
          .select('*')
          .order('ingested_at', { ascending: false })
          .limit(limit),
        'listRawSignals'
      );
      return (rows || []).map((r) => ({
        id: r.id,
        source: r.source,
        text: r.text,
        url: r.url,
        clusterId: r.cluster_id,
        publishedAt: r.published_at,
        ingestedAt: r.ingested_at,
      }));
    },

    // --- ingestion runs -----------------------------------------------------
    async startRun() {
      const rows = unwrap(
        await db().from('ingestion_runs').insert({ status: 'running' }).select(),
        'startRun'
      );
      const row = rows?.[0];
      return row ? { id: row.id, status: row.status, startedAt: row.started_at } : null;
    },

    async finishRun(runId, patch) {
      const rows = unwrap(
        await db()
          .from('ingestion_runs')
          .update({
            status: patch.status,
            signals_count: patch.signalsCount ?? 0,
            opportunities_count: patch.opportunitiesCount ?? 0,
            sources_json: patch.sources ?? [],
            error: patch.error ?? null,
            finished_at: patch.finishedAt || new Date().toISOString(),
          })
          .eq('id', runId)
          .select(),
        'finishRun'
      );
      return rows?.[0] || null;
    },

    async listRuns(limit = 10) {
      const rows = unwrap(
        await db()
          .from('ingestion_runs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(limit),
        'listRuns'
      );
      return (rows || []).map((r) => ({
        id: r.id,
        status: r.status,
        signalsCount: r.signals_count,
        opportunitiesCount: r.opportunities_count,
        sources: r.sources_json || [],
        error: r.error,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
      }));
    },

    // --- usage --------------------------------------------------------------
    async logUsage(entry) {
      const rows = unwrap(
        await withUserRow(
          entry.userId,
          () =>
            db()
              .from('api_usage')
              .insert({
                user_id: entry.userId || null,
                feature: entry.feature,
                provider: entry.provider,
                outcome: entry.outcome,
                tokens_used: entry.tokensUsed || 0,
                cost_estimate: entry.costEstimate || 0,
                latency_ms: entry.latencyMs || 0,
                day_key: utcDayKey(),
              })
              .select(),
          'logUsage'
        ),
        'logUsage'
      );
      return rows?.[0] || null;
    },

    async countUsageToday(userId, feature) {
      const query = db()
        .from('api_usage')
        .select('id', { count: 'exact', head: true })
        .eq('day_key', utcDayKey())
        .eq('feature', feature)
        .in('outcome', ['live', 'cached']);

      const result = userId ? await query.eq('user_id', userId) : await query.is('user_id', null);
      return result.count ?? 0;
    },

    async sumCostToday() {
      const rows = unwrap(
        await db().from('api_usage').select('cost_estimate').eq('day_key', utcDayKey()),
        'sumCostToday'
      );
      return (rows || []).reduce((total, r) => total + (Number(r.cost_estimate) || 0), 0);
    },

    async usageStats(days = 7) {
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
      const rows = unwrap(
        await db()
          .from('api_usage')
          .select('*')
          .gte('created_at', cutoff)
          .order('created_at', { ascending: false })
          .limit(5000),
        'usageStats'
      );
      return (rows || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        feature: r.feature,
        provider: r.provider,
        outcome: r.outcome,
        tokensUsed: r.tokens_used,
        costEstimate: Number(r.cost_estimate) || 0,
        latencyMs: r.latency_ms,
        dayKey: r.day_key,
        createdAt: r.created_at,
      }));
    },

    // --- profiles -----------------------------------------------------------
    async getProfile(userId) {
      const rows = unwrap(
        await db().from('user_profiles').select('*').eq('user_id', userId).limit(1),
        'getProfile'
      );
      return rows?.length ? toProfile(rows[0]) : null;
    },

    async upsertProfile(userId, patch) {
      const rows = unwrap(
        await withUserRow(
          userId,
          () =>
            db()
              .from('user_profiles')
              .upsert({ ...fromProfile(patch), user_id: userId }, { onConflict: 'user_id' })
              .select(),
          'upsertProfile'
        ),
        'upsertProfile'
      );
      return rows?.length ? toProfile(rows[0]) : null;
    },

    // --- community ----------------------------------------------------------
    async createPost(post) {
      const rows = unwrap(
        await withUserRow(
          post.userId,
          () =>
            db()
              .from('community_posts')
              .insert({
                user_id: post.userId,
                title: post.title,
                body: post.body || '',
                topic: post.topic || 'general',
                tags_json: post.tags || [],
                link_url: post.linkUrl || '',
                opportunity_id: post.opportunityId || null,
              })
              .select(),
          'createPost'
        ),
        'createPost'
      );
      return rows?.length ? toPost(rows[0]) : null;
    },

    async listPosts({ topic = 'all', authorId = null, limit = 50 } = {}) {
      let query = db()
        .from('community_posts')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (topic && topic !== 'all') query = query.eq('topic', topic);
      if (authorId) query = query.eq('user_id', authorId);

      const rows = unwrap(await query, 'listPosts');
      return (rows || []).map(toPost);
    },

    async getPost(postId) {
      const rows = unwrap(
        await db().from('community_posts').select('*').eq('id', postId).limit(1),
        'getPost'
      );
      return rows?.length ? toPost(rows[0]) : null;
    },

    async updatePost(postId, patch) {
      const payload = {};
      if (patch.title !== undefined) payload.title = patch.title;
      if (patch.body !== undefined) payload.body = patch.body;
      if (patch.topic !== undefined) payload.topic = patch.topic;
      if (patch.tags !== undefined) payload.tags_json = patch.tags;
      if (patch.linkUrl !== undefined) payload.link_url = patch.linkUrl;
      if (patch.pinned !== undefined) payload.pinned = patch.pinned;

      const rows = unwrap(
        await db().from('community_posts').update(payload).eq('id', postId).select(),
        'updatePost'
      );
      return rows?.length ? toPost(rows[0]) : null;
    },

    async deletePost(postId) {
      // Comments cascade in SQL; votes do not, because they point at two
      // different tables and cannot carry a foreign key to either.
      const comments = unwrap(
        await db().from('community_comments').select('id').eq('post_id', postId),
        'deletePost:comments'
      );
      const commentIds = (comments || []).map((c) => c.id);

      if (commentIds.length) {
        unwrap(
          await db().from('community_votes').delete().eq('target_type', 'comment').in('target_id', commentIds),
          'deletePost:commentVotes'
        );
      }
      unwrap(
        await db().from('community_votes').delete().eq('target_type', 'post').eq('target_id', postId),
        'deletePost:postVotes'
      );
      unwrap(await db().from('community_posts').delete().eq('id', postId), 'deletePost');
      return true;
    },

    async createComment(comment) {
      const rows = unwrap(
        await withUserRow(
          comment.userId,
          () =>
            db()
              .from('community_comments')
              .insert({
                post_id: comment.postId,
                parent_id: comment.parentId || null,
                user_id: comment.userId,
                body: comment.body,
              })
              .select(),
          'createComment'
        ),
        'createComment'
      );
      return rows?.length ? toComment(rows[0]) : null;
    },

    async listComments(postId) {
      const rows = unwrap(
        await db()
          .from('community_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true }),
        'listComments'
      );
      return (rows || []).map(toComment);
    },

    async getComment(commentId) {
      const rows = unwrap(
        await db().from('community_comments').select('*').eq('id', commentId).limit(1),
        'getComment'
      );
      return rows?.length ? toComment(rows[0]) : null;
    },

    async deleteComment(commentId) {
      unwrap(
        await db().from('community_votes').delete().eq('target_type', 'comment').eq('target_id', commentId),
        'deleteComment:votes'
      );
      unwrap(await db().from('community_comments').delete().eq('id', commentId), 'deleteComment');
      return true;
    },

    async countCommentsByPost(postIds) {
      if (!postIds.length) return {};
      const rows = unwrap(
        await db().from('community_comments').select('post_id').in('post_id', postIds),
        'countCommentsByPost'
      );
      return (rows || []).reduce((acc, row) => {
        acc[row.post_id] = (acc[row.post_id] || 0) + 1;
        return acc;
      }, {});
    },

    async setVote(userId, targetType, targetId, value) {
      if (value !== 1 && value !== -1) {
        unwrap(
          await db()
            .from('community_votes')
            .delete()
            .eq('user_id', userId)
            .eq('target_type', targetType)
            .eq('target_id', targetId),
          'setVote:clear'
        );
        return true;
      }

      unwrap(
        await withUserRow(
          userId,
          () =>
            db()
              .from('community_votes')
              .upsert(
                { user_id: userId, target_type: targetType, target_id: targetId, value },
                { onConflict: 'user_id,target_type,target_id' }
              ),
          'setVote'
        ),
        'setVote'
      );
      return true;
    },

    async listVotes(targetType, targetIds) {
      if (!targetIds.length) return [];
      const rows = unwrap(
        await db()
          .from('community_votes')
          .select('user_id, target_type, target_id, value')
          .eq('target_type', targetType)
          .in('target_id', targetIds),
        'listVotes'
      );
      return (rows || []).map((r) => ({
        userId: r.user_id,
        targetType: r.target_type,
        targetId: r.target_id,
        value: r.value,
      }));
    },

    async countPostsByUser(userId) {
      const result = await db()
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      return result.count ?? 0;
    },

    async countCommentsByUser(userId) {
      const result = await db()
        .from('community_comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      return result.count ?? 0;
    },

    // --- roadmaps -----------------------------------------------------------
    async saveRoadmap(entry) {
      const rows = unwrap(
        await withUserRow(
          entry.userId,
          () =>
            db()
              .from('roadmaps')
              .insert({
                user_id: entry.userId || null,
                input_kind: entry.inputKind || 'idea',
                input_text: entry.inputText,
                horizon: entry.horizon || '90 days',
                title: entry.title || '',
                result_json: entry.result || {},
              })
              .select(),
          'saveRoadmap'
        ),
        'saveRoadmap'
      );
      return rows?.length ? toRoadmap(rows[0]) : null;
    },

    async listRoadmaps(userId, limit = 10) {
      const rows = unwrap(
        await db()
          .from('roadmaps')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        'listRoadmaps'
      );
      return (rows || []).map(toRoadmap);
    },

    async getRoadmap(id) {
      const rows = unwrap(await db().from('roadmaps').select('*').eq('id', id).limit(1), 'getRoadmap');
      return rows?.length ? toRoadmap(rows[0]) : null;
    },

    // --- AI cache -----------------------------------------------------------
    async getCached(key) {
      const rows = unwrap(
        await db()
          .from('ai_cache')
          .select('value_json, expires_at')
          .eq('key', key)
          .gt('expires_at', new Date().toISOString())
          .limit(1),
        'getCached'
      );
      return rows?.[0]?.value_json || null;
    },

    async setCached(key, value, ttlMs) {
      unwrap(
        await db()
          .from('ai_cache')
          .upsert(
            {
              key,
              value_json: value,
              expires_at: new Date(Date.now() + ttlMs).toISOString(),
            },
            { onConflict: 'key' }
          ),
        'setCached'
      );
      return true;
    },

    // --- Admin emails --------------------------------------------------------
    async getAdminEmails() {
      try {
        const rows = unwrap(
          await db().from('admin_emails').select('id, email, added_by, created_at').order('created_at', { ascending: false }),
          'getAdminEmails'
        );
        return rows.map((r) => ({
          id: r.id,
          email: r.email,
          addedBy: r.added_by,
          createdAt: r.created_at,
        }));
      } catch {
        return [];
      }
    },

    async addAdminEmail(email, addedBy = 'system') {
      const normalised = email.trim().toLowerCase();
      try {
        const rows = unwrap(
          await db()
            .from('admin_emails')
            .upsert({ email: normalised, added_by: addedBy }, { onConflict: 'email' })
            .select('id, email, added_by, created_at'),
          'addAdminEmail'
        );
        const r = rows[0];
        return { id: r.id, email: r.email, addedBy: r.added_by, createdAt: r.created_at };
      } catch {
        return { id: `admin:${normalised}`, email: normalised, addedBy, createdAt: new Date().toISOString() };
      }
    },

    async removeAdminEmail(email) {
      const normalised = email.trim().toLowerCase();
      try {
        unwrap(await db().from('admin_emails').delete().eq('email', normalised), 'removeAdminEmail');
      } catch {
        // Ignored
      }
      return true;
    },

    async getRevokedAdminEmails() {
      try {
        const rows = unwrap(await db().from('revoked_admin_emails').select('email'), 'getRevokedAdminEmails');
        return rows.map((r) => r.email);
      } catch {
        return [];
      }
    },

    async unrevokeAdminEmail(email) {
      const normalised = email.trim().toLowerCase();
      try {
        unwrap(await db().from('revoked_admin_emails').delete().eq('email', normalised), 'unrevokeAdminEmail');
      } catch {
        // Ignored
      }
      return true;
    },
  };
}

export default createSupabaseDriver;
