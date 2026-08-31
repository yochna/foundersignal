import { gemini } from '@/lib/config';
import { fetchWithTimeout } from '@/lib/http';
import { AppError, ErrorCode } from '@/lib/errors';

/**
 * Minimal Gemini REST client.
 *
 * Deliberately not using @google/generative-ai: the REST surface we need is one
 * POST, and avoiding the SDK keeps the dependency tree and cold start smaller.
 */

/**
 * Gemini free-tier pricing is zero, but we still estimate a notional cost so the
 * admin dashboard can show a meaningful budget bar and the global cap has
 * something to measure. Figures are per million tokens for the Flash tier.
 */
const PRICE_PER_MILLION = { input: 0.1, output: 0.4 };

export function estimateCost({ inputTokens = 0, outputTokens = 0 }) {
  return (
    (inputTokens / 1_000_000) * PRICE_PER_MILLION.input +
    (outputTokens / 1_000_000) * PRICE_PER_MILLION.output
  );
}

/** Rough token estimate for when the API omits usageMetadata. */
export function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Marks an error as not worth retrying. An invalid key or an unknown model will
 * fail identically on every attempt, so retrying only adds seconds of latency
 * before the user gets their fallback result.
 */
function permanent(error) {
  error.permanent = true;
  return error;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pull the most useful message out of Gemini's error envelope. */
function describeError(status, body, model) {
  const message = body?.error?.message || body?.message;
  if (message) return message;

  switch (status) {
    case 400:
      return 'Gemini rejected the request as malformed';
    case 401:
    case 403:
      return 'Gemini rejected the API key. Check GEMINI_API_KEY is valid and the Generative Language API is enabled.';
    case 404:
      return `Model "${model}" was not found for this key`;
    case 429:
      return 'Gemini free-tier rate limit reached';
    default:
      return `Gemini responded with status ${status}`;
  }
}

/**
 * Call Gemini once, with exponential backoff on transient failures.
 *
 * `parts` follows the Gemini content format, so callers can pass plain text or
 * inlineData for PDFs without this function knowing the difference.
 *
 * Each attempt moves down the model list, so a retired or overloaded model costs
 * one attempt rather than the whole call. Retrying the same overloaded model is
 * rarely what we want on the free tier: "high demand" on the newest Flash model
 * tends to persist for minutes, while its predecessor answers immediately.
 *
 * `deadlineMs` bounds the total time across all attempts. Without it, three
 * attempts against an endpoint that accepts the connection and never answers
 * would stack up into minutes of waiting, well past both the browser's patience
 * and a serverless function's execution limit, when a deterministic result was
 * available the whole time.
 */
export async function callGemini({
  systemInstruction,
  parts,
  temperature = 0.3,
  maxOutputTokens = 2048,
  json = true,
  maxAttempts = 3,
  timeoutMs = 35_000,
  deadlineMs = 50_000,
}) {
  if (!gemini.apiKey) {
    throw new AppError(ErrorCode.AI_UNAVAILABLE, 'GEMINI_API_KEY is not configured');
  }

  const models = [gemini.model, ...gemini.fallbackModels];
  /** Attempt 1 uses the primary, then each retry drops to the next model. */
  const modelFor = (attempt) => models[Math.min(attempt - 1, models.length - 1)];

  const buildBody = (model) => ({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.95,
      // Only pass thinkingConfig if explicitly configured > 0 or dynamic (-1)
      ...(gemini.thinkingBudget > 0
        ? { thinkingConfig: { thinkingBudget: gemini.thinkingBudget } }
        : {}),
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
    // Analysing regulatory and fraud topics trips conservative defaults, so the
    // thresholds are relaxed to the least restrictive supported setting.
    safetySettings: [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT',
    ].map((category) => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
  });

  const deadline = Date.now() + deadlineMs;
  const remaining = () => deadline - Date.now();
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = Date.now();
    const model = modelFor(attempt);

    // Under two seconds left is not enough for a useful attempt.
    if (attempt > 1 && remaining() < 2000) {
      console.warn(`[gemini] out of time after ${attempt - 1} attempt(s), falling back`);
      break;
    }

    try {
      const response = await fetchWithTimeout(
        `${gemini.baseUrl}/${model}:generateContent?key=${encodeURIComponent(gemini.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(model)),
        },
        // A model that accepts the connection and then stalls must not eat the
        // whole deadline, or the fallback models never get asked.
        Math.min(timeoutMs, Math.max(5000, remaining() - 1000))
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = describeError(response.status, payload, model);
        const nextModel = attempt < maxAttempts ? modelFor(attempt + 1) : null;
        const switchingModel = Boolean(nextModel) && nextModel !== model;

        // A 404 means this model id is gone. Retrying it is pointless, but the
        // next one in the list may well answer.
        if (RETRYABLE_STATUS.has(response.status) || (response.status === 404 && switchingModel)) {
          if (attempt < maxAttempts) {
            // Honour Retry-After when present, else exponential backoff with
            // jitter. Switching model needs no backoff: the new one is not the
            // thing that was busy.
            const retryAfter = Number(response.headers.get('retry-after'));
            const requested = switchingModel
              ? 0
              : Number.isFinite(retryAfter) && retryAfter > 0
                ? Math.min(retryAfter * 1000, 8000)
                : 2 ** (attempt - 1) * 700 + Math.random() * 350;
            // Never sleep past the deadline; the fallback is more useful than a wait.
            const delay = Math.max(0, Math.min(requested, remaining() - 2000));

            console.warn(
              `[gemini] ${model} returned ${response.status} on attempt ${attempt}/${maxAttempts}, ` +
                `${switchingModel ? `trying ${nextModel}` : `retrying in ${Math.round(delay)}ms`}: ${message}`
            );
            if (delay > 0) await sleep(delay);
            lastError = new AppError(
              response.status === 429 ? ErrorCode.UPSTREAM_RATE_LIMITED : ErrorCode.AI_UNAVAILABLE,
              message
            );
            continue;
          }
        }

        const code =
          response.status === 429
            ? ErrorCode.UPSTREAM_RATE_LIMITED
            : response.status === 401 || response.status === 403
              ? ErrorCode.AI_UNAVAILABLE
              : ErrorCode.UPSTREAM_UNAVAILABLE;

        const failure = new AppError(code, message, { details: payload?.error?.status });

        // Any 4xx other than 429 is a configuration or request problem that a
        // retry cannot fix.
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw permanent(failure);
        }
        throw failure;
      }

      const candidate = payload?.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (!candidate || finishReason === 'SAFETY' || finishReason === 'BLOCKLIST') {
        throw new AppError(
          ErrorCode.AI_INVALID_RESPONSE,
          `Gemini blocked the response (${finishReason || 'no candidate returned'})`
        );
      }

      const text = (candidate.content?.parts || [])
        .map((part) => part.text || '')
        .join('')
        .trim();

      if (!text) {
        throw new AppError(ErrorCode.AI_INVALID_RESPONSE, 'Gemini returned an empty response body');
      }

      const usage = payload?.usageMetadata || {};
      const inputTokens = usage.promptTokenCount ?? estimateTokens(JSON.stringify(parts));
      const outputTokens = usage.candidatesTokenCount ?? estimateTokens(text);

      return {
        text,
        // MAX_TOKENS means the JSON is probably truncated; the repair layer in
        // lib/ai/json.js closes unbalanced braces, so it is still worth parsing.
        truncated: finishReason === 'MAX_TOKENS',
        provider: 'gemini',
        model,
        attempts: attempt,
        latencyMs: Date.now() - started,
        tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
        costEstimate: estimateCost({ inputTokens, outputTokens }),
      };
    } catch (error) {
      if (error.permanent) throw error;

      if (error instanceof AppError && error.code !== ErrorCode.UPSTREAM_UNAVAILABLE) {
        // Non-retryable, or already exhausted retries above.
        if (error.code === ErrorCode.UPSTREAM_RATE_LIMITED && attempt < maxAttempts) {
          lastError = error;
          await sleep(Math.max(0, Math.min(2 ** (attempt - 1) * 700, remaining() - 2000)));
          continue;
        }
        throw error;
      }

      lastError = error;
      if (attempt >= maxAttempts) break;

      const delay = Math.max(
        0,
        Math.min(2 ** (attempt - 1) * 700 + Math.random() * 350, remaining() - 2000)
      );
      console.warn(
        `[gemini] ${model} failed on attempt ${attempt}/${maxAttempts}, ` +
          `trying ${modelFor(attempt + 1)} in ${Math.round(delay)}ms: ${error.message}`
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof AppError
    ? lastError
    : new AppError(ErrorCode.UPSTREAM_UNAVAILABLE, lastError?.message || 'Gemini call failed', {
        cause: lastError,
      });
}

/** Probe used by /api/health. Never throws. */
export async function pingGemini() {
  if (!gemini.apiKey) return { ok: false, reason: 'no-key' };
  try {
    const result = await callGemini({
      parts: [{ text: 'Reply with {"ok":true} and nothing else.' }],
      maxOutputTokens: 32,
      maxAttempts: 1,
      timeoutMs: 8000,
    });
    return { ok: true, latencyMs: result.latencyMs, model: result.model };
  } catch (error) {
    return { ok: false, reason: error.code || 'error', message: error.message };
  }
}
