import { fetchWithTimeout } from '@/lib/http';

/**
 * Dev.to & Indie Hackers engineering blogs connector (Category 1: Tech & Dev - P1 / Tier B).
 * Identifies tool limitations, framework workarounds, and early B2B SaaS criticisms.
 */

const TAGS = ['fintech', 'india', 'saas', 'automation', 'compliance'];

export async function fetchDevtoSignals() {
  const started = Date.now();
  const items = [];
  const failures = [];

  for (const tag of TAGS) {
    const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=10&top=14`;

    try {
      const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'FounderSignal/2.0' } }, 8_000);

      if (!response.ok) {
        failures.push(`${response.status} on Dev.to tag "${tag}"`);
        continue;
      }

      const articles = await response.json();
      for (const article of articles || []) {
        if (!article?.title) continue;

        items.push({
          source: 'Dev.to Community',
          sourceFamily: 'devto',
          category: 'tech_developer',
          tier: 'tier_b',
          text: `[${article.title}] - ${article.description || ''} (tags: ${article.tag_list?.join(', ') || tag})`.trim(),
          url: article.url || null,
          publishedAt: article.published_at ? article.published_at.slice(0, 10) : null,
          engagement: (Number(article.positive_reactions_count) || 0) + (Number(article.comments_count) || 0) * 2,
          query: tag,
        });
      }
    } catch (error) {
      failures.push(`${error.name === 'AbortError' ? 'timeout' : error.message} on Dev.to "${tag}"`);
    }
  }

  return {
    name: 'devto',
    category: 'tech_developer',
    tier: 'tier_b',
    ok: items.length > 0,
    mode: 'public-api',
    items,
    status: items.length > 0 ? 'ok' : failures.length ? 'failed' : 'empty',
    error: failures.length > 0 ? failures.slice(0, 3).join('; ') : null,
    durationMs: Date.now() - started,
  };
}

export default fetchDevtoSignals;
