import { withApi, searchParams } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { getAdminStats } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (request) => {
  await requireAdmin();

  const days = Number(searchParams(request).get('days'));
  const window = Number.isFinite(days) && days >= 1 && days <= 30 ? Math.round(days) : 7;

  return { stats: await getAdminStats({ days: window }) };
});
