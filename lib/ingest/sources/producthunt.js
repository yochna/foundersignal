import { fetchFeedsToItems } from '@/lib/ingest/sources/feed-utils';

/**
 * Product Hunt launches (Category 4: Market Activity - P1 / Tier B).
 *
 * New launches show where builders are already spending weekends, and the
 * comment volume around a launch is a proxy for how contested a category is.
 * The public RSS feed needs no credentials; when it is blocked or slow the
 * connector reports failed like every other source.
 */

const PRODUCT_HUNT_FEEDS = [
  {
    name: 'Product Hunt (Daily Launches)',
    url: 'https://www.producthunt.com/feed',
    agency: 'Product Hunt',
    sourceFamily: 'producthunt',
    maxItems: 20,
  },
];

export async function fetchProductHuntSignals() {
  const started = Date.now();

  const { items, perFeed } = await fetchFeedsToItems(PRODUCT_HUNT_FEEDS, {
    timeoutMs: 10_000,
    filter: (item) => item.text.length > 30,
  });

  const failed = perFeed.filter((line) => !line.includes('items')).length;

  return {
    name: 'producthunt',
    category: 'market_activity',
    tier: 'tier_b',
    ok: items.length > 0,
    mode: 'public-rss',
    items,
    status: items.length > 0 ? 'ok' : failed > 0 ? 'failed' : 'empty',
    error: failed > 0 ? perFeed.filter((l) => !l.includes('items')).join('; ') : null,
    detail: perFeed,
    durationMs: Date.now() - started,
  };
}

export default fetchProductHuntSignals;
