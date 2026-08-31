import { fetchFeedsToItems } from '@/lib/ingest/sources/feed-utils';

/**
 * Indian & global startup news / blogs (Category 5: Media - P1 / Tier B).
 *
 * Mainstream and trade coverage is a weaker signal than a raw forum complaint,
 * but it catches category creation moments (funding rounds, policy coverage,
 * new market announcements) before community chatter builds up. India-first
 * outlets are weighted by count; every URL is env-overridable so a dead feed
 * can be swapped without a code change.
 */

function feedUrl(envName, fallback) {
  const value = (process.env[envName] ?? '').toString().trim();
  return value.length > 0 ? value : fallback;
}

const NEWS_FEEDS = [
  {
    name: 'YourStory (Indian Startups)',
    url: feedUrl('YOURSTORY_RSS_URL', 'https://yourstory.com/feed'),
    agency: 'YourStory',
    sourceFamily: 'news',
    maxItems: 12,
  },
  {
    name: 'Inc42 (Indian Startup Ecosystem)',
    url: feedUrl('INC42_RSS_URL', 'https://inc42.com/feed/'),
    agency: 'Inc42',
    sourceFamily: 'news',
    maxItems: 12,
  },
  {
    name: 'ET Tech (Technology News)',
    url: feedUrl('ETTECH_RSS_URL', 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms'),
    agency: 'ET Tech',
    sourceFamily: 'news',
    maxItems: 12,
  },
  {
    name: 'TechCrunch (Startups)',
    url: feedUrl('TECHCRUNCH_RSS_URL', 'https://techcrunch.com/feed/'),
    agency: 'TechCrunch',
    sourceFamily: 'news',
    maxItems: 10,
  },
].filter((f) => f.url);

/** India-relevant terms that keep global feeds from flooding out local signal. */
const RELEVANCE_TERMS = [
  'india',
  'indian',
  'bharat',
  'bengaluru',
  'bangalore',
  'mumbai',
  'delhi',
  'hyderabad',
  'chennai',
  'pune',
  'upi',
  'rbi',
  'sebi',
  'gst',
  'saas',
  'fintech',
  'startup',
  'funding',
  'series a',
  'seed round',
  'b2b',
  'd2c',
  'msme',
];

export async function fetchNewsSignals() {
  const started = Date.now();

  // India-first outlets pass everything; global outlets (TechCrunch) must
  // mention an Indian term somewhere in title or body to be worth clustering.
  const { items, perFeed } = await fetchFeedsToItems(NEWS_FEEDS, {
    timeoutMs: 10_000,
    filter: (item) => {
      if (item.source.startsWith('TechCrunch')) {
        const lower = item.text.toLowerCase();
        return RELEVANCE_TERMS.some((term) => lower.includes(term));
      }
      return true;
    },
  });

  const failed = perFeed.filter((line) => !line.includes('items')).length;

  return {
    name: 'news',
    category: 'media_coverage',
    tier: 'tier_b',
    ok: items.length > 0,
    mode: `${NEWS_FEEDS.length} outlets`,
    items,
    status: items.length > 0 ? 'ok' : failed > 0 ? 'failed' : 'empty',
    error: failed > 0 ? perFeed.filter((l) => !l.includes('items')).join('; ') : null,
    detail: perFeed,
    durationMs: Date.now() - started,
  };
}

export default fetchNewsSignals;
