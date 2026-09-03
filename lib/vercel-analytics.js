import { vercelAnalytics, hasVercelAnalytics } from '@/lib/config';

/**
 * Reads real visitor traffic from Vercel's Web Analytics API for the admin
 * panel. This is a thin read-only wrapper: no writes, no tracking script
 * here (that's @vercel/analytics in components/providers.jsx). If the token
 * or project id is missing, or the request fails, this returns
 * `{ configured: false }` / `{ configured: true, ok: false, ... }` rather
 * than throwing, matching the "amber, not an error" pattern the rest of the
 * admin panel uses for unconfigured subsystems.
 *
 * https://vercel.com/docs/analytics/web-analytics-api
 */

const BASE_URL = 'https://api.vercel.com/v1/query/web-analytics';
const TIMEOUT_MS = 6000;

function authedQuery(path, params) {
  const url = new URL(`${BASE_URL}/${path}`);
  url.searchParams.set('projectId', vercelAnalytics.projectId);
  if (vercelAnalytics.teamId) url.searchParams.set('teamId', vercelAnalytics.teamId);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  return fetch(url, {
    headers: { Authorization: `Bearer ${vercelAnalytics.token}` },
    signal: controller.signal,
    cache: 'no-store',
  }).finally(() => clearTimeout(timer));
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * @param {{ days?: number }} options
 * @returns {Promise<object>} summary for the admin "Visitor analytics" card
 */
export async function getWebAnalyticsSummary({ days = 7 } = {}) {
  if (!hasVercelAnalytics) return { configured: false };

  const until = new Date();
  const since = new Date(until.getTime() - days * 86400000);

  try {
    const [totalRes, dailyRes, routesRes] = await Promise.all([
      authedQuery('visits/count', { since: dayKey(since), until: dayKey(until) }),
      authedQuery('visits/aggregate', { since: dayKey(since), until: dayKey(until), by: 'day' }),
      authedQuery('visits/aggregate', {
        since: dayKey(since),
        until: dayKey(until),
        by: 'route',
        limit: '8',
      }),
    ]);

    if (!totalRes.ok || !dailyRes.ok || !routesRes.ok) {
      const failed = [totalRes, dailyRes, routesRes].find((r) => !r.ok);
      const body = await failed.text().catch(() => '');
      return {
        configured: true,
        ok: false,
        error: `Vercel API responded ${failed.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
      };
    }

    const [total, dailyJson, routesJson] = await Promise.all([
      totalRes.json(),
      dailyRes.json(),
      routesRes.json(),
    ]);

    const daily = (dailyJson.data || []).map((row) => ({
      day: row.timestamp,
      pageviews: row.pageviews,
      visitors: row.visitors,
    }));

    const topRoutes = (routesJson.data || [])
      .map((row) => ({ route: row.route || '(unknown)', pageviews: row.pageviews, visitors: row.visitors }))
      .sort((a, b) => b.pageviews - a.pageviews);

    return {
      configured: true,
      ok: true,
      pageviews: total.data?.pageviews ?? 0,
      visitors: total.data?.visitors ?? 0,
      daily,
      topRoutes,
      days,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      error: error?.name === 'AbortError' ? 'Vercel API did not respond in time' : error.message,
    };
  }
}

export default getWebAnalyticsSummary;
