import { withApi, searchParams } from '@/lib/api';
import { computeStats, loadOpportunities, queryOpportunities, toCompact } from '@/lib/opportunities';
import { VERTICALS } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities
 *
 * Query params: q, vertical, momentum, sort, limit, offset, fields=compact|full,
 * stats=1. Invalid values are ignored rather than rejected, so a stale
 * bookmarked URL still returns a useful feed.
 */
export const GET = withApi(async (request) => {
  const params = searchParams(request);

  const q = (params.get('q') || '').slice(0, 200);
  const verticalParam = params.get('vertical') || 'all';
  const vertical = verticalParam === 'all' || VERTICALS.includes(verticalParam) ? verticalParam : 'all';
  const momentumParam = params.get('momentum') || 'all';
  const momentum = ['all', 'rising', 'steady', 'declining'].includes(momentumParam)
    ? momentumParam
    : 'all';
  const sort = params.get('sort') || 'score';
  const limit = Math.min(Math.max(Number.parseInt(params.get('limit') || '0', 10) || 0, 0), 100);
  const offset = Math.max(Number.parseInt(params.get('offset') || '0', 10) || 0, 0);
  const compact = params.get('fields') === 'compact';
  const wantStats = params.get('stats') === '1';

  const { opportunities, source, storeError } = await loadOpportunities();
  const { rows, total } = queryOpportunities(opportunities, {
    q,
    vertical,
    momentum,
    sort,
    limit,
    offset,
  });

  return {
    opportunities: compact ? rows.map(toCompact) : rows,
    total,
    returned: rows.length,
    filters: { q, vertical, momentum, sort, limit, offset },
    ...(wantStats ? { stats: computeStats(opportunities) } : {}),
    meta: {
      dataSource: source,
      // Present only when the primary store failed; the UI shows a banner.
      ...(storeError ? { storeError } : {}),
    },
  };
});
