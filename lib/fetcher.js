'use client';

/**
 * Client-side API helper.
 *
 * Guarantees the caller always receives `{ ok, data | error }` and never a
 * thrown network exception, so every page can render an ErrorPanel instead of
 * tripping an error boundary.
 */

const GENERIC_NETWORK_ERROR = {
  code: 'UPSTREAM_UNAVAILABLE',
  message: 'Could not reach the server',
  hint: 'Check your connection. If the dev server restarted, reload the page.',
};

async function request(path, { method = 'GET', body, formData, signal, timeoutMs = 45_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Respect an external abort (component unmount) as well as our own timeout.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const init = { method, signal: controller.signal, headers: {} };

    if (formData) {
      init.body = formData;
    } else if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(path, init);

    let payload = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        // A non-JSON body means something upstream of the route handler failed,
        // e.g. a framework-level 500 HTML page.
        return {
          ok: false,
          status: response.status,
          error: {
            code: 'INTERNAL',
            message: `Server returned a non-JSON response (${response.status})`,
            hint: 'Check the server logs for the underlying error.',
          },
        };
      }
    }

    if (!response.ok || payload?.ok === false) {
      return {
        ok: false,
        status: response.status,
        error:
          payload?.error || {
            code: 'INTERNAL',
            message: `Request failed with status ${response.status}`,
            hint: 'Try again in a moment.',
          },
      };
    }

    return { ok: true, status: response.status, data: payload || {} };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        error: {
          code: 'UPSTREAM_UNAVAILABLE',
          message: 'The request timed out',
          hint: 'AI analysis can take a few seconds. Try again.',
        },
      };
    }
    return { ok: false, status: 0, error: GENERIC_NETWORK_ERROR };
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  postForm: (path, formData, options) => request(path, { ...options, method: 'POST', formData }),
  del: (path, body, options) => request(path, { ...options, method: 'DELETE', body }),
};

export default api;
