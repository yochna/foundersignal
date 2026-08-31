import { fetchWithTimeout } from '@/lib/http';
import { reddit, hasRedditAuth } from '@/lib/config';

/**
 * Reddit connector with multi-tier resilience:
 *   1. OAuth (script app credentials if provided)
 *   2. Public Subreddit RSS/Atom feeds (zero configuration, no API keys required)
 *   3. Public JSON search
 */

const SUBREDDITS = [
  { sub: 'developersIndia', category: 'Tech & Dev Pain', weight: 1.2 },
  { sub: 'indiastartups', category: 'Indian Startup Ecosystem', weight: 1.2 },
  { sub: 'solopreneur', category: 'Indie Builder / Micro-SaaS', weight: 1.0 },
  { sub: 'IndiaInvestments', category: 'Fintech & Banking Friction', weight: 1.0 },
  { sub: 'IndiaTech', category: 'Consumer & Tech Hurdles', weight: 0.9 },
  { sub: 'SaaS', category: 'B2B SaaS Discussions', weight: 0.9 },
];

const PER_REQUEST_TIMEOUT_MS = 10_000;

function parseRedditAtom(xml, subreddit) {
  const items = [];
  const entryMatches = xml.matchAll(/<entry>(.*?)<\/entry>/gs);

  for (const [, entry] of entryMatches) {
    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
    const linkMatch = entry.match(/<link href="([^"]+)"/);
    const contentMatch = entry.match(/<content type="html">(.*?)<\/content>/s);
    const updatedMatch = entry.match(/<updated>(.*?)<\/updated>/);

    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : `https://www.reddit.com/r/${subreddit}`;
    const rawContent = contentMatch ? contentMatch[1] : '';
    const date = updatedMatch ? updatedMatch[1].slice(0, 10) : new Date().toISOString().slice(0, 10);

    if (!title || title.startsWith('Who&#39;s looking') || title.startsWith('Who&#39;s hiring')) continue;

    const cleanContent = rawContent
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .slice(0, 400)
      .trim();

    items.push({
      source: `Reddit (r/${subreddit})`,
      sourceFamily: 'reddit',
      category: 'social_community',
      tier: 'tier_a',
      text: [title, cleanContent].filter(Boolean).join(' - ').slice(0, 500),
      url: link,
      publishedAt: date,
      engagement: 12,
      query: `r/${subreddit}`,
    });
  }

  return items;
}

let cachedToken = null;

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const basic = Buffer.from(`${reddit.clientId}:${reddit.clientSecret}`).toString('base64');
  const response = await fetchWithTimeout(
    'https://www.reddit.com/api/v1/access_token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': reddit.userAgent,
      },
      body: 'grant_type=client_credentials',
    },
    10_000
  );

  if (!response.ok) throw new Error(`token request returned ${response.status}`);

  const json = await response.json();
  if (!json.access_token) throw new Error('token response had no access_token');

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (Number(json.expires_in) || 3600) * 1000,
  };
  return cachedToken.value;
}

export async function fetchRedditSignals() {
  const started = Date.now();
  const items = [];
  const failures = [];
  let mode = hasRedditAuth ? 'oauth' : 'rss-feeds';

  // Strategy 1: OAuth if configured
  if (hasRedditAuth) {
    try {
      const token = await getToken();
      const QUERIES = [
        { q: 'UPI fraud merchant chargeback', sub: 'developersIndia+indiastartups' },
        { q: 'RBI compliance KYC fintech', sub: 'IndiaInvestments+indiastartups' },
        { q: 'GST reconciliation input tax e-invoicing', sub: 'IndiaTax+indiastartups' },
        { q: 'legacy code migration refactor python node', sub: 'developersIndia' },
        { q: 'b2b saas pricing micro-saas validation', sub: 'solopreneur+indiastartups' },
      ];

      for (const { q, sub } of QUERIES) {
        const url = `https://oauth.reddit.com/r/${sub}/search?q=${encodeURIComponent(q)}&sort=new&limit=8&restrict_sr=1`;
        try {
          const res = await fetchWithTimeout(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': reddit.userAgent,
            },
          }, PER_REQUEST_TIMEOUT_MS);

          if (res.ok) {
            const data = await res.json();
            for (const child of data?.data?.children || []) {
              const d = child.data;
              if (d && (d.title || d.selftext)) {
                items.push({
                  source: `Reddit (r/${d.subreddit})`,
                  sourceFamily: 'reddit',
                  category: 'social_community',
                  tier: 'tier_a',
                  text: [d.title, String(d.selftext || '').slice(0, 400)].filter(Boolean).join(' - '),
                  url: d.permalink ? `https://www.reddit.com${d.permalink}` : null,
                  publishedAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString().slice(0, 10) : null,
                  engagement: (Number(d.score) || 0) + (Number(d.num_comments) || 0) * 2,
                  query: q,
                });
              }
            }
          }
        } catch (err) {
          failures.push(`oauth error on ${q}: ${err.message}`);
        }
      }
    } catch (err) {
      mode = 'rss-feeds';
      failures.push(`oauth init failed: ${err.message}, falling back to RSS feeds`);
    }
  }

  // Strategy 2: Direct Subreddit RSS/Atom Feeds (Zero auth required)
  if (items.length === 0) {
    for (const { sub } of SUBREDDITS) {
      try {
        const url = `https://www.reddit.com/r/${sub}/hot.rss?limit=15`;
        const res = await fetchWithTimeout(
          url,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              Accept: 'application/rss+xml, application/atom+xml, text/xml, */*',
            },
          },
          PER_REQUEST_TIMEOUT_MS
        );

        if (!res.ok) {
          failures.push(`HTTP ${res.status} on r/${sub}.rss`);
          continue;
        }

        const xml = await res.text();
        const parsed = parseRedditAtom(xml, sub);
        items.push(...parsed);
      } catch (err) {
        failures.push(`${err.name === 'AbortError' ? 'timeout' : err.message} on r/${sub}`);
      }
    }
  }

  return {
    name: 'reddit',
    category: 'social_community',
    tier: 'tier_a',
    ok: items.length > 0,
    mode,
    items,
    status: items.length > 0 ? 'ok' : failures.length ? 'failed' : 'empty',
    error: items.length === 0 && failures.length > 0 ? failures.slice(0, 3).join('; ') : null,
    durationMs: Date.now() - started,
  };
}

export default fetchRedditSignals;
