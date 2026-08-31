import { withApi } from '@/lib/api';
import { notFound } from '@/lib/errors';
import { loadOpportunities, resolveRelated } from '@/lib/opportunities';

export const dynamic = 'force-dynamic';

/** GET /api/opportunities/:id — full brief plus resolved related briefs. */
export const GET = withApi(async (_request, { params }) => {
  const id = decodeURIComponent(params?.id || '').trim();
  if (!id) throw notFound('No opportunity id supplied');

  const { opportunities, source } = await loadOpportunities();
  const opportunity = opportunities.find((o) => o.id === id);

  if (!opportunity) {
    throw notFound(`No opportunity with id "${id}"`, {
      hint: 'It may have been replaced by a newer ingestion run. Return to the radar for the current feed.',
    });
  }

  return {
    opportunity,
    related: resolveRelated(opportunity, opportunities),
    meta: { dataSource: source },
  };
});
