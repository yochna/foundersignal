import { createHash } from 'node:crypto';
import { hasGemini, quotas } from '@/lib/config';
import { repo } from '@/lib/db';
import { AppError, ErrorCode, toAppError } from '@/lib/errors';
import { callGemini } from '@/lib/ai/gemini';
import { parseModelJson } from '@/lib/ai/json';
import { checkQuota, recordUsage, resetAtIso, PRO_LIMIT } from '@/lib/ai/quota';
import { isProRequest } from '@/lib/entitlements';
import {
  buildChatPrompt,
  buildMatchPrompt,
  buildResumePrompt,
  buildRoadmapPrompt,
  buildValidationPrompt,
} from '@/lib/ai/prompts';
import {
  heuristicChat,
  heuristicMatch,
  heuristicResume,
  heuristicRoadmap,
  heuristicValidation,
  rankCorpusByText,
} from '@/lib/ai/heuristics';
import {
  chatResultSchema,
  matchResultSchema,
  resumeResultSchema,
  roadmapResultSchema,
  validationResultSchema,
} from '@/lib/schemas';

/**
 * Single entry point for every AI feature.
 *
 * The contract: runAi() ALWAYS resolves with a usable result. It never rejects
 * for an upstream failure. The caller inspects `meta.source` to know whether the
 * answer came from the model (`live`), the response cache (`cached`), or the
 * deterministic tier (`fallback`), and `meta.degradedReason` explains any
 * downgrade in plain language for the UI to display.
 *
 * Order of operations:
 *   1. No API key            -> fallback
 *   2. Cache hit             -> cached (does not consume quota)
 *   3. Quota or budget spent -> fallback
 *   4. Model call            -> live, or fallback on any failure
 */

const FEATURES = {
  'idea-validator': {
    buildPrompt: buildValidationPrompt,
    schema: validationResultSchema,
    heuristic: ({ input, corpus }) => heuristicValidation(input.idea, corpus),
    isUsable: (d) => d.validationScore > 0 && Boolean(d.summary || d.verdict),
    cacheKey: ({ input }) => normalize(input.idea),
    maxOutputTokens: 2048,
    temperature: 0.35,
  },
  'builder-match': {
    buildPrompt: buildMatchPrompt,
    schema: matchResultSchema,
    heuristic: ({ input, corpus }) => heuristicMatch(input.answers, corpus),
    isUsable: (d) => d.matches.length > 0,
    cacheKey: ({ input }) =>
      Object.keys(input.answers || {})
        .sort()
        .map((key) => `${key}=${input.answers[key]}`)
        .join('&'),
    maxOutputTokens: 3072,
    temperature: 0.3,
  },
  'career-signal': {
    buildPrompt: buildResumePrompt,
    schema: resumeResultSchema,
    heuristic: ({ input, corpus }) =>
      heuristicResume(input.resumeText, input.fileName, corpus),
    isUsable: (d) => d.skills.length > 0 || d.demandScore > 0,
    // Resume analysis is not cached across users: the same text from two people
    // is vanishingly unlikely, and caching parsed personal data is undesirable.
    cacheKey: null,
    maxOutputTokens: 2560,
    temperature: 0.25,
  },
  roadmap: {
    buildPrompt: buildRoadmapPrompt,
    schema: roadmapResultSchema,
    heuristic: ({ input, corpus }) => heuristicRoadmap(input, corpus),
    isUsable: (d) => d.phases.length > 0 && d.phases.some((p) => p.tasks.length > 0),
    cacheKey: ({ input }) => `${input.kind}|${input.horizon}|${input.hoursPerWeek}|${normalize(input.goal)}`,
    maxOutputTokens: 3072,
    temperature: 0.35,
  },
  chat: {
    buildPrompt: buildChatPrompt,
    schema: chatResultSchema,
    heuristic: ({ input, corpus }) => heuristicChat(input.message, corpus),
    isUsable: (d) => d.answer.trim().length >= 12,
    cacheKey: ({ input }) =>
      // History is excluded so a repeated question in a new session still hits.
      normalize(input.message),
    // 1024 was too tight: multi-item answers ("give me 10 projects") routinely
    // ran out of budget mid-sentence, got silently patched by the JSON repair
    // step, and shipped a truncated answer to the user. Match the other
    // list-producing features (builder-match, roadmap) at 3072.
    maxOutputTokens: 3072,
    temperature: 0.4,
  },
};

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function hashKey(feature, seed) {
  return `${feature}:${createHash('sha256').update(seed).digest('hex').slice(0, 40)}`;
}

/**
 * Human-readable explanation of a downgrade. This text is shown to the user, so
 * it names the cause and the remedy rather than an error code.
 */
function explainDowngrade(cause, detail) {
  switch (cause) {
    case 'no-key':
      return 'No Gemini API key is configured on the server, so this result was produced by deterministic rule-based scoring instead of a language model.';
    case 'quota':
      return `You have used your free daily allowance for this feature, so deterministic scoring was used instead. The allowance resets at 00:00 UTC.`;
    case 'budget':
      return 'The shared daily AI budget for this demo deployment is spent, so deterministic scoring was used instead. It resets at 00:00 UTC.';
    case 'rate-limited':
      return 'The AI provider is rate limiting us right now, so deterministic scoring was used. Retrying in a minute usually restores live analysis.';
    case 'invalid-json':
      return 'The model returned output that could not be parsed into the expected structure, so deterministic scoring was used. Retrying often succeeds.';
    case 'provider-error':
      return `The AI provider could not be reached (${detail || 'unknown error'}), so deterministic scoring was used.`;
    default:
      return 'Live AI was unavailable, so deterministic scoring was used.';
  }
}

/**
 * Run one AI feature.
 *
 * @param {object} options
 * @param {string} options.feature   key from FEATURES
 * @param {string|null} options.userId
 * @param {object} options.input     feature-specific payload
 * @param {Array}  options.corpus    opportunity records for grounding and fallback
 * @param {object} [options.promptExtras] extra fields merged into the prompt builder input
 * @param {boolean} [options.forceLive] skip the cache (used by an explicit "regenerate")
 */
export async function runAi({ feature, userId = null, input, corpus = [], promptExtras = {}, forceLive = false }) {
  const config = FEATURES[feature];
  if (!config) throw new AppError(ErrorCode.BAD_REQUEST, `Unknown AI feature "${feature}"`);

  const started = Date.now();

  // Deterministic tier is computed lazily, but only once.
  let heuristicResult = null;
  const heuristic = () => {
    if (!heuristicResult) heuristicResult = config.heuristic({ input, corpus });
    return heuristicResult;
  };

  const respond = (data, meta) => ({
    data,
    meta: { feature, latencyMs: Date.now() - started, ...meta },
  });

  const fallback = async (cause, detail, extra = {}) => {
    await recordUsage({
      userId,
      feature,
      provider: hasGemini ? 'gemini' : 'none',
      outcome: cause === 'quota' || cause === 'budget' ? 'blocked' : 'fallback',
      tokensUsed: 0,
      costEstimate: 0,
      latencyMs: Date.now() - started,
    });

    return respond(heuristic(), {
      source: 'fallback',
      degradedReason: explainDowngrade(cause, detail),
      cause,
      ...extra,
    });
  };

  // --- 1. No key -------------------------------------------------------------
  if (!hasGemini) {
    return fallback('no-key');
  }

  // --- 2. Cache --------------------------------------------------------------
  const cacheSeed = config.cacheKey ? config.cacheKey({ input }) : null;
  const cacheKey = cacheSeed ? hashKey(feature, cacheSeed) : null;

  if (cacheKey && !forceLive) {
    try {
      const cached = await repo.getCached(cacheKey);
      if (cached) {
        await recordUsage({
          userId,
          feature,
          provider: 'gemini',
          outcome: 'cached',
          tokensUsed: 0,
          costEstimate: 0,
          latencyMs: Date.now() - started,
        });
        return respond(cached, { source: 'cached', cacheKey });
      }
    } catch (error) {
      // A cache miss and a cache failure are equivalent here.
      console.warn('[gateway] cache read failed:', error.message);
    }
  }

  // --- 3. Quota --------------------------------------------------------------
  // Entitlement is resolved server-side; a client cannot claim Pro status.
  let isPro = false;
  try {
    isPro = await isProRequest();
  } catch {
    isPro = false;
  }
  const quota = await checkQuota({ feature, userId, isPro });
  if (!quota.allowed) {
    return fallback(quota.reason === 'budget' ? 'budget' : 'quota', null, {
      quota: {
        limit: quota.limit,
        used: quota.used,
        remaining: 0,
        resetAt: quota.resetAt,
        isAnonymous: quota.isAnonymous,
      },
    });
  }

  // --- 4. Live call ----------------------------------------------------------
  try {
    const prompt = config.buildPrompt({ ...input, ...promptExtras, corpus });

    const result = await callGemini({
      systemInstruction: prompt.systemInstruction,
      parts: prompt.parts,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      json: true,
    });

    const parsed = parseModelJson(result.text);
    if (!parsed.ok) {
      console.error(`[gateway] ${feature}: ${parsed.error}. Raw head: ${result.text.slice(0, 180)}`);
      await recordUsage({
        userId,
        feature,
        provider: 'gemini',
        outcome: 'error',
        tokensUsed: result.tokens.total,
        costEstimate: result.costEstimate,
        latencyMs: result.latencyMs,
      });
      return fallback('invalid-json', parsed.error);
    }

    // Coerce into the expected shape. The schemas default every field, so a
    // partially-formed model response still produces a complete object.
    const validated = config.schema.safeParse(parsed.value);
    if (!validated.success) {
      console.error(
        `[gateway] ${feature}: response failed validation:`,
        validated.error.issues.slice(0, 3)
      );
      await recordUsage({
        userId,
        feature,
        provider: 'gemini',
        outcome: 'error',
        tokensUsed: result.tokens.total,
        costEstimate: result.costEstimate,
        latencyMs: result.latencyMs,
      });
      return fallback('invalid-json', 'response did not match the expected schema');
    }

    const data = validated.data;

    // The schemas default every field, so a refusal or an empty object survives
    // validation as an all-zero result. That would render as a real analysis, so
    // treat it as a failed call instead.
    if (config.isUsable && !config.isUsable(data)) {
      console.error(`[gateway] ${feature}: model returned an empty result, using heuristics`);
      await recordUsage({
        userId,
        feature,
        provider: 'gemini',
        outcome: 'error',
        tokensUsed: result.tokens.total,
        costEstimate: result.costEstimate,
        latencyMs: result.latencyMs,
      });
      return fallback('invalid-json', 'the model returned an empty analysis');
    }

    await recordUsage({
      userId,
      feature,
      provider: 'gemini',
      outcome: 'live',
      tokensUsed: result.tokens.total,
      costEstimate: result.costEstimate,
      latencyMs: result.latencyMs,
    });

    // Cache only clean, non-truncated responses.
    if (cacheKey && !result.truncated) {
      try {
        await repo.setCached(cacheKey, data, quotas.cacheTtlHours * 3600 * 1000);
      } catch (error) {
        console.warn('[gateway] cache write failed:', error.message);
      }
    }

    return respond(data, {
      source: 'live',
      model: result.model,
      attempts: result.attempts,
      tokens: result.tokens.total,
      costEstimate: result.costEstimate,
      truncated: result.truncated || undefined,
      quota: {
        limit: quota.limit,
        used: quota.used + 1,
        remaining: quota.unlimited ? PRO_LIMIT : Math.max(0, quota.remaining - 1),
        resetAt: quota.resetAt,
        unlimited: quota.unlimited,
        isPro: quota.isPro,
      },
      ...(parsed.strategy !== 'direct' ? { jsonRepair: parsed.strategy } : {}),
    });
  } catch (error) {
    const appError = toAppError(error);

    await recordUsage({
      userId,
      feature,
      provider: 'gemini',
      outcome: 'error',
      tokensUsed: 0,
      costEstimate: 0,
      latencyMs: Date.now() - started,
    });

    const cause =
      appError.code === ErrorCode.UPSTREAM_RATE_LIMITED
        ? 'rate-limited'
        : appError.code === ErrorCode.AI_INVALID_RESPONSE
          ? 'invalid-json'
          : 'provider-error';

    return fallback(cause, appError.message);
  }
}

/** Retrieval step for chat. Kept here so the route stays thin. */
export function retrieveForChat(corpus, message, limit = 3) {
  return rankCorpusByText(corpus, message, limit);
}

/** Remaining allowance, for rendering a quota meter before the user submits. */
export async function getQuotaState(feature, userId) {
  if (!hasGemini) {
    return {
      aiConfigured: false,
      limit: 0,
      used: 0,
      remaining: 0,
      resetAt: resetAtIso(),
      mode: 'heuristic',
    };
  }
  let isPro = false;
  try {
    isPro = await isProRequest();
  } catch {
    isPro = false;
  }
  const state = await checkQuota({ feature, userId, isPro });
  return {
    aiConfigured: true,
    limit: state.limit,
    used: state.used,
    remaining: state.remaining,
    resetAt: state.resetAt,
    isAnonymous: state.isAnonymous,
    isPro: state.isPro,
    unlimited: state.unlimited,
    mode: state.allowed ? 'live' : state.reason === 'budget' ? 'budget-exhausted' : 'quota-exhausted',
  };
}

export default runAi;
