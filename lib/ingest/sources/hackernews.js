import { fetchWithTimeout } from '@/lib/http';

/**
 * Hacker News API connector (Category 1: Tech & Dev - P1 / Tier B).
 * Mined for "Ask HN", "Show HN", and architectural criticism threads.
 */

const KEYWORDS = [
  'pain',
  'broken',
  'slow',
  'manual',
  'automate',
  'compliance',
  'fintech',
  'india',
  'saas',
  'b2b',
  'api',
  'limitation',
  'workaround',
  'alternative',
];

export async function fetchHackerNewsSignals() {
  const started = Date.now();
  const items = [];
  const failures = [];

  try {
    const askRes = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/askstories.json', {}, 8_000);
    const showRes = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/showstories.json', {}, 8_000);

    const askIds = askRes.ok ? await askRes.json() : [];
    const showIds = showRes.ok ? await showRes.json() : [];

    const targetIds = [...(askIds || []).slice(0, 25), ...(showIds || []).slice(0, 25)];

    const itemPromises = targetIds.map(async (id) => {
      try {
        const res = await fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {}, 6_000);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    });

    const settled = await Promise.allSettled(itemPromises);
    for (const result of settled) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const story = result.value;
      if (!story.title) continue;

      const titleLower = story.title.toLowerCase();
      const matches = KEYWORDS.some((kw) => titleLower.includes(kw));

      if (matches || story.score >= 15) {
        const cleanText = String(story.text || '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 350);

        items.push({
          source: story.title.startsWith('Ask HN') ? 'Hacker News (Ask HN)' : 'Hacker News (Show HN)',
          sourceFamily: 'hackernews',
          category: 'tech_developer',
          tier: 'tier_b',
          text: `${story.title}${cleanText ? ` - ${cleanText}` : ''}`.trim(),
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          publishedAt: story.time ? new Date(story.time * 1000).toISOString().slice(0, 10) : null,
          engagement: (Number(story.score) || 0) + (Number(story.descendants) || 0) * 2,
          query: 'HN Pain & Critiques',
        });
      }
    }
  } catch (error) {
    failures.push(`${error.name === 'AbortError' ? 'timeout' : error.message} on Hacker News`);
  }

  return {
    name: 'hackernews',
    category: 'tech_developer',
    tier: 'tier_b',
    ok: items.length > 0,
    mode: 'firebase-api',
    items,
    status: items.length > 0 ? 'ok' : failures.length ? 'failed' : 'empty',
    error: failures.length > 0 ? failures.join('; ') : null,
    durationMs: Date.now() - started,
  };
}

export default fetchHackerNewsSignals;
