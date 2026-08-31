import {
  parser,
  isoDate,
  extractEntries,
  entryText,
  entryLink,
} from '@/lib/ingest/sources/feed-utils';
import { fetchWithTimeout } from '@/lib/http';
import { rssFeeds } from '@/lib/config';

/**
 * Regulator feeds (RBI, SEBI). These are the highest-value signals in the whole
 * pipeline because regulatory pressure is what creates compliance markets, but
 * government endpoints are also the least reliable, so every failure mode here
 * is expected and reported rather than thrown.
 *
 * Feed parsing helpers live in feed-utils.js and are shared with the community,
 * product launch and startup news connectors.
 */

async function fetchOne(feed) {
  const response = await fetchWithTimeout(
    feed.url,
    {
      headers: {
        'User-Agent': 'FounderSignalBot/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      // Regulator feeds change at most daily.
      next: { revalidate: 3600 },
    },
    // Feeds run in parallel, so this is also the connector's worst case.
    10_000
  );

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const xml = await response.text();
  if (!xml.trim().startsWith('<')) throw new Error('response was not XML');

  const entries = extractEntries(parser.parse(xml));
  if (entries.length === 0) throw new Error('feed parsed but contained no entries');

  return entries
    .map((entry) => ({
      source: `${feed.agency} (${feed.name})`,
      sourceFamily: 'rss',
      agency: feed.agency,
      text: entryText(entry),
      url: entryLink(entry),
      publishedAt: isoDate(entry.pubDate || entry.published || entry.updated || entry['dc:date']),
      engagement: 0,
      query: feed.name,
    }))
    .filter((item) => item.text.length > 20)
    .slice(0, 25);
}

export async function fetchRssSignals() {
  const started = Date.now();
  const items = [];
  const perFeed = [];

  // Feeds are independent, so one hanging endpoint should not delay the others.
  const results = await Promise.allSettled(rssFeeds.map((feed) => fetchOne(feed)));

  results.forEach((result, index) => {
    const feed = rssFeeds[index];
    if (result.status === 'fulfilled') {
      items.push(...result.value);
      perFeed.push(`${feed.agency}: ${result.value.length} items`);
    } else {
      const reason = result.reason;
      perFeed.push(
        `${feed.agency}: ${reason?.name === 'AbortError' ? 'timeout' : reason?.message || 'failed'}`
      );
    }
  });

  const failed = results.filter((r) => r.status === 'rejected').length;

  return {
    name: 'rss',
    ok: items.length > 0,
    mode: `${rssFeeds.length} feed${rssFeeds.length === 1 ? '' : 's'}`,
    items,
    status: items.length > 0 ? 'ok' : failed > 0 ? 'failed' : 'empty',
    error: failed > 0 ? perFeed.join('; ') : null,
    detail: perFeed,
    durationMs: Date.now() - started,
  };
}

export default fetchRssSignals;
