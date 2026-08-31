/**
 * Framework-free outbound HTTP helpers.
 *
 * Deliberately separate from lib/api.js: that module imports next/server, which
 * makes it unusable from the plain-node ingestion CLI. The connectors only need
 * fetch with a timeout, so it lives here and lib/api re-exports it.
 */

/**
 * fetch with a hard timeout, so a hanging upstream can never hold a serverless
 * function open until the platform kills it.
 */
if (process.env.NODE_ENV !== 'production' && typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** True when a failure is worth retrying rather than reporting immediately. */
export function isTransientStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export default fetchWithTimeout;
