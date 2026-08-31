import { hasSupabase } from '@/lib/config';
import { createFileDriver } from '@/lib/db/file';
import { createSupabaseDriver } from '@/lib/db/supabase';

/**
 * Repository facade.
 *
 * Chooses Supabase when credentials exist, otherwise the file/memory store. If
 * a Supabase call fails at runtime (project paused, network blocked, bad key)
 * every call transparently falls back to the local store so the product stays
 * usable, and the failure is recorded for /api/health and the status banner.
 */

/**
 * How long to route straight to the local store after a Supabase failure.
 * Without this, an unreachable project adds its full connect timeout (~7s
 * observed) to every single request.
 */
const BREAKER_COOLDOWN_MS = 30_000;

let primary = null;
let fallback = null;
let supabaseDegraded = null;

function getPrimary() {
  if (!primary) {
    primary = hasSupabase ? createSupabaseDriver() : createFileDriver();
  }
  return primary;
}

function getFallback() {
  if (!fallback) fallback = createFileDriver();
  return fallback;
}

function markDegraded(method, error) {
  const message = error?.message || String(error);
  // Only log the first failure of a cooldown window; a dead project otherwise
  // floods the logs with one identical line per query.
  if (!breakerOpen()) {
    console.error(`[db] supabase ${method} failed, using local store: ${message}`);
  }
  supabaseDegraded = {
    at: new Date().toISOString(),
    retryAt: new Date(Date.now() + BREAKER_COOLDOWN_MS).toISOString(),
    method,
    message,
  };
}

/** True while we are still inside the cooldown after a Supabase failure. */
function breakerOpen() {
  if (!supabaseDegraded) return false;
  return Date.parse(supabaseDegraded.retryAt) > Date.now();
}

async function call(method, args) {
  const driver = getPrimary();

  if (typeof driver[method] !== 'function') {
    throw new Error(`Repository method not implemented: ${method}`);
  }

  if (driver.name === 'supabase' && breakerOpen()) {
    return getFallback()[method](...args);
  }

  try {
    const result = await driver[method](...args);
    // A previously failing Supabase that now answers clears the warning.
    if (driver.name === 'supabase' && supabaseDegraded && method !== 'describe') {
      console.info('[db] supabase recovered, resuming primary store');
      supabaseDegraded = null;
    }
    return result;
  } catch (error) {
    if (driver.name !== 'supabase') throw error;

    markDegraded(method, error);
    // Writes fall back too. Landing them locally is honest as long as
    // /api/health and the status banner report degraded persistence, and it
    // beats a hard error on every save while the project is unreachable.
    return getFallback()[method](...args);
  }
}

/** Explicit surface so a typo becomes an immediate error rather than undefined. */
const METHODS = [
  'describe',
  'listOpportunities',
  'getOpportunity',
  'upsertOpportunities',
  'upsertUser',
  'countUsers',
  'listUsersByIds',
  'listSaved',
  'isSaved',
  'addSaved',
  'removeSaved',
  'countSavedTotal',
  'saveQuizResult',
  'latestQuizResult',
  'saveResumeProfile',
  'latestResumeProfile',
  'saveValidation',
 'listValidations',
'listValidationsAdmin',
'countValidationsTotal',
  'appendChat',
  'listChat',
  'clearChat',
  'replaceRawSignals',
  'listRawSignals',
  'startRun',
  'finishRun',
  'listRuns',
  'logUsage',
  'countUsageToday',
  'sumCostToday',
  'usageStats',
  'getCached',
  'setCached',
  'getProfile',
  'upsertProfile',
  'saveRoadmap',
  'listRoadmaps',
  'getRoadmap',
  'getAdminEmails',
  'addAdminEmail',
  'removeAdminEmail',
  'getRevokedAdminEmails',
  'unrevokeAdminEmail',
  'getUserPlan',
  'setUserPlan',
  'createPaymentOrder',
  'markPaymentCaptured',
  'getPaymentOrder',
];

export const repo = METHODS.reduce((acc, method) => {
  acc[method] = (...args) => call(method, args);
  return acc;
}, {});

/**
 * Describes the store that is actually serving traffic, which during a Supabase
 * outage is the local one. Callers use `writable` to decide whether to accept a
 * save, so it has to reflect the effective store rather than the configured one.
 */
export async function describeStore() {
  const driver = getPrimary();

  if (driver.name === 'supabase' && breakerOpen()) {
    return { ...(await getFallback().describe()), configured: 'supabase', degraded: supabaseDegraded };
  }

  let info;
  try {
    info = await driver.describe();
  } catch (error) {
    info = { driver: driver.name, reachable: false, writable: false, error: error.message };
  }

  // The Supabase driver reports unreachability instead of throwing, so trip the
  // breaker here too and answer with the store that will handle the next call.
  if (driver.name === 'supabase' && info.reachable === false) {
    markDegraded('describe', new Error(info.error || 'unreachable'));
    return {
      ...(await getFallback().describe()),
      configured: 'supabase',
      degraded: supabaseDegraded,
      probe: info,
    };
  }

  return {
    ...info,
    configured: hasSupabase ? 'supabase' : 'file',
    // Only meaningful while Supabase is the primary; a stale flag would keep the
    // status banner shouting about a database this process no longer uses.
    degraded: driver.name === 'supabase' ? supabaseDegraded : null,
  };
}

export default repo;
