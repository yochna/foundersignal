import { XMLParser } from 'fast-xml-parser';
import { toArray } from '@/lib/utils';
import { fetchWithTimeout } from '@/lib/http';

/**
 * Shared RSS / Atom / RDF parsing helpers for every feed-based connector.
 *
 * The regulator connector (rss.js), the community forums connector, the product
 * launches connector and the startup news connector all speak these formats, so
 * the parsing lives here once: tolerant of RSS 2.0, RDF and Atom in one pass,
 * and always returning plain-text items.
 */

export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

export function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function isoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/** Handles RSS 2.0, RDF (RBI serves this) and Atom in one pass. */
export function extractEntries(parsed) {
  if (parsed?.rss?.channel) return toArray(parsed.rss.channel.item);
  if (parsed?.['rdf:RDF']) return toArray(parsed['rdf:RDF'].item);
  if (parsed?.feed?.entry) return toArray(parsed.feed.entry);
  return [];
}

export function entryText(entry) {
  const title = stripHtml(entry.title?.['#text'] || entry.title);
  const body = stripHtml(
    entry.description || entry.summary?.['#text'] || entry.summary || entry.content?.['#text'] || ''
  );
  if (!title && !body) return '';
  return body && body.toLowerCase() !== title.toLowerCase()
    ? `${title} - ${body.slice(0, 400)}`
    : title;
}

export function entryLink(entry) {
  if (typeof entry.link === 'string') return entry.link;
  if (Array.isArray(entry.link)) {
    const alternate = entry.link.find((l) => l?.['@_href']);
    return alternate?.['@_href'] || null;
  }
  return entry.link?.['@_href'] || entry.guid?.['#text'] || entry.guid || null;
}

/**
 * Fetches a list of feeds in parallel and maps entries into raw-signal items.
 *
 * Every failure is captured per feed rather than thrown, so one dead blog never
 * delays or sinks the whole connector. `options.filter` lets a connector drop
 * off-topic entries before they reach the clustering stage.
 */
export async function fetchFeedsToItems(feeds, { timeoutMs = 10_000, filter } = {}) {
  const items = [];
  const perFeed = [];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const response = await fetchWithTimeout(
        feed.url,
        {
          headers: {
            'User-Agent': 'FounderSignalBot/1.0',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          // Blogs and news feeds change at most daily.
          next: { revalidate: 3600 },
        },
        timeoutMs
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xml = await response.text();
      if (!xml.trim().startsWith('<')) throw new Error('response was not XML');

      const entries = extractEntries(parser.parse(xml));
      if (entries.length === 0) throw new Error('feed parsed but contained no entries');

      return entries
        .map((entry) => ({
          source: `${feed.agency} (${feed.name})`,
          sourceFamily: feed.sourceFamily,
          agency: feed.agency,
          text: entryText(entry),
          url: entryLink(entry),
          publishedAt: isoDate(entry.pubDate || entry.published || entry.updated || entry['dc:date']),
          engagement: Number(feed.baseEngagement) || 0,
          query: feed.name,
        }))
        .filter((item) => item.text.length > 20)
        .filter((item) => (typeof filter === 'function' ? filter(item) : true))
        .slice(0, feed.maxItems || 15);
    })
  );

  results.forEach((result, index) => {
    const feed = feeds[index];
    if (result.status === 'fulfilled') {
      items.push(...result.value);
      perFeed.push(`${feed.name}: ${result.value.length} items`);
    } else {
      const reason = result.reason;
      perFeed.push(`${feed.name}: ${reason?.name === 'AbortError' ? 'timeout' : reason?.message || 'failed'}`);
    }
  });

  return { items, perFeed };
}