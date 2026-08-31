import { fetchWithTimeout } from '@/lib/http';

/**
 * Stack Overflow / Stack Exchange API connector (Category 1: Tech & Dev - P0 / Tier A).
 * Monitors software development bottlenecks, recurrent error patterns, and API integration hurdles.
 */

const TAGS = [
  { tag: 'payment-gateway', query: 'Fintech & Payment Gateway Friction' },
  { tag: 'fintech', query: 'Fintech Architecture' },
  { tag: 'upi', query: 'UPI & Indian Banking Integrations' },
  { tag: 'ocr', query: 'Document OCR & KYC Extraction' },
  { tag: 'compliance', query: 'Data Compliance & Encryption' },
  { tag: 'microservices', query: 'Legacy Code & Microservices Migration' },
];

export async function fetchStackOverflowSignals() {
  const started = Date.now();
  const items = [];
  const failures = [];

  for (const group of TAGS) {
    const url = `https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&tagged=${encodeURIComponent(
      group.tag
    )}&site=stackoverflow&pagesize=10&filter=withbody`;

    try {
      const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'FounderSignal/2.0' } }, 10_000);

      if (!response.ok) {
        failures.push(`${response.status} on StackOverflow tag "${group.tag}"`);
        continue;
      }

      const json = await response.json();
      for (const question of json.items || []) {
        if (!question?.title) continue;
        const cleanBody = String(question.body || '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 400);

        items.push({
          source: 'Stack Overflow',
          sourceFamily: 'stackoverflow',
          category: 'tech_developer',
          tier: 'tier_a',
          text: `[Q: ${question.title}] - ${cleanBody}`.trim(),
          url: question.link || null,
          publishedAt: question.creation_date ? new Date(question.creation_date * 1000).toISOString().slice(0, 10) : null,
          engagement: (Number(question.score) || 0) * 2 + (Number(question.answer_count) || 0),
          query: group.query,
        });
      }
    } catch (error) {
      failures.push(`${error.name === 'AbortError' ? 'timeout' : error.message} on StackOverflow "${group.query}"`);
    }
  }

  return {
    name: 'stackoverflow',
    category: 'tech_developer',
    tier: 'tier_a',
    ok: items.length > 0,
    mode: 'public-api',
    items,
    status: items.length > 0 ? 'ok' : failures.length ? 'failed' : 'empty',
    error: failures.length > 0 ? failures.slice(0, 3).join('; ') : null,
    durationMs: Date.now() - started,
  };
}

export default fetchStackOverflowSignals;
