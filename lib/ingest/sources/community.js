import { fetchFeedsToItems } from '@/lib/ingest/sources/feed-utils';

/**
 * UGC community forums & practitioner blogs (Category 1/2: Communities - P1 / Tier B).
 *
 * Captures founder-to-founder complaints, build-in-public post-mortems and
 * practitioner blog rants. These are the highest-context UGC sources: people
 * describing what is broken in their own words, unmediated by journalists.
 *
 * Every feed here is public RSS; a dead or blocked feed degrades that single
 * source to 'failed' in the run report instead of affecting the others.
 */

const COMMUNITY_FEEDS = [
  {
    name: 'Lobsters (Tech Discussion)',
    url: 'https://lobste.rs/rss',
    agency: 'Lobsters',
    sourceFamily: 'community',
    maxItems: 12,
  },
  {
    name: 'HackerNoon (Practitioner Blogs)',
    url: 'https://hackernoon.com/feed',
    agency: 'HackerNoon',
    sourceFamily: 'community',
    maxItems: 12,
  },
  {
    name: 'Medium /tag/startups',
    url: 'https://medium.com/feed/tag/startups',
    agency: 'Medium',
    sourceFamily: 'community',
    maxItems: 10,
  },
  {
    name: 'Medium /tag/saas',
    url: 'https://medium.com/feed/tag/saas',
    agency: 'Medium',
    sourceFamily: 'community',
    maxItems: 10,
  },
  {
    name: 'Medium /tag/fintech',
    url: 'https://medium.com/feed/tag/fintech',
    agency: 'Medium',
    sourceFamily: 'community',
    maxItems: 8,
  },
  {
    name: 'Indie Hackers (Founder Forum)',
    url: 'https://www.indiehackers.com/feed.xml',
    agency: 'Indie Hackers',
    sourceFamily: 'community',
    maxItems: 10,
  },
];

/**
 * Keeps clustering focused: drop pure culture pieces and listicles that carry
 * no pain-point or market signal. Everything else passes through to the
 * keyword clusters.
 */
const NOISE_TERMS = [
  'hiring!',
  'we are hiring',
  'giveaway',
  'podcast episode',
  'weekly thread',
  'who is hiring',
];

export async function fetchCommunitySignals() {
  const started = Date.now();

  const { items, perFeed } = await fetchFeedsToItems(COMMUNITY_FEEDS, {
    timeoutMs: 10_000,
    filter: (item) => {
      const lower = item.text.toLowerCase();
      return !NOISE_TERMS.some((term) => lower.includes(term));
    },
  });

  const failed = perFeed.filter((line) => !line.includes('items')).length;

  return {
    name: 'community',
    category: 'tech_developer',
    tier: 'tier_b',
    ok: items.length > 0,
    mode: `${COMMUNITY_FEEDS.length} feeds`,
    items,
    status: items.length > 0 ? 'ok' : failed > 0 ? 'failed' : 'empty',
    error: failed > 0 ? perFeed.filter((l) => !l.includes('items')).join('; ') : null,
    detail: perFeed,
    durationMs: Date.now() - started,
  };
}

export default fetchCommunitySignals;
