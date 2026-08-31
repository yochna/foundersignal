import Link from 'next/link';
import { Bookmark, BookmarkPlus, Radar as RadarIcon, AlertTriangle, Gauge } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { OpportunityCard } from '@/components/opportunity/opportunity-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KpiTile } from '@/components/radar/kpi-tile';
import { requireUser } from '@/lib/auth';
import { repo, describeStore } from '@/lib/db';
import { loadOpportunities, hydrateSaved } from '@/lib/opportunities';
import { clampScore } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Watchlist',
  description: 'The opportunities you are tracking, with their current scores and momentum.',
};

export default async function SavedPage() {
  const user = await requireUser();

  let savedIds = [];
  let lookupError = null;
  try {
    savedIds = await repo.listSaved(user.id);
  } catch (error) {
    lookupError = error.message;
    console.error('[saved] watchlist lookup failed:', error.message);
  }

  const { opportunities } = await loadOpportunities();
  const { opportunities: saved, missing } = hydrateSaved(savedIds, opportunities);
  const store = await describeStore();

  const avgScore = saved.length
    ? clampScore(saved.reduce((total, o) => total + o.score, 0) / saved.length)
    : 0;
  const rising = saved.filter((o) => o.momentum === 'rising').length;

  return (
    <>
      <PageHeader
        eyebrow="Track"
        title="Watchlist"
        icon={Bookmark}
        description="Saved briefs stay tied to your account and always show current scores, so you can see whether the case for an idea is strengthening or fading."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/radar">
              <RadarIcon />
              Browse the radar
            </Link>
          </Button>
        }
      />

      {lookupError ? (
        <ErrorPanel
          error={{
            code: 'DB_UNAVAILABLE',
            message: 'Your watchlist could not be read.',
            hint: 'The rest of the app still works. Reload in a moment, or check the admin dashboard for store health.',
          }}
          className="mb-6"
        />
      ) : null}

      {store.writable === false ? (
        <Card tone="glass" className="mb-6 flex flex-wrap items-center gap-3 border-amber-signal/25 p-4">
          <Badge variant="amber">
            <AlertTriangle />
            Not persistent
          </Badge>
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-surface-variant">
            This deployment has no writable store, so saves live in memory only and disappear when the
            server restarts. Configuring Supabase makes them permanent.
          </p>
        </Card>
      ) : null}

      {saved.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile label="Tracked" value={saved.length} icon={Bookmark} accent="primary" />
          <KpiTile
            label="Average score"
            value={avgScore}
            unit="/100"
            icon={Gauge}
            accent="indigo"
            hint="Across your watchlist"
          />
          <KpiTile
            label="Rising"
            value={rising}
            icon={RadarIcon}
            accent="emerald"
            hint="Momentum still building"
          />
          <KpiTile
            label="Of the feed"
            value={
              opportunities.length ? Math.round((saved.length / opportunities.length) * 100) : 0
            }
            unit="%"
            icon={BookmarkPlus}
            accent="violet"
            hint={`${opportunities.length} briefs live`}
          />
        </div>
      ) : null}

      {missing.length > 0 ? (
        <Card tone="glass" className="mb-6 p-4">
          <p className="text-[11px] leading-relaxed text-on-surface-variant">
            <span className="font-bold text-on-surface">
              {missing.length} saved {missing.length === 1 ? 'brief is' : 'briefs are'} no longer in the
              feed.
            </span>{' '}
            An ingestion run can retire a cluster when its signals dry up. The saved reference is kept
            so nothing vanishes without explanation.
          </p>
        </Card>
      ) : null}

      {saved.length === 0 ? (
        <EmptyState
          icon={BookmarkPlus}
          tone="primary"
          title="Your watchlist is empty"
          description="Save a brief from the radar or any detail page and it will appear here with its live score, so you can watch a handful of ideas rather than re-reading the whole feed."
          action={
            <>
              <Button asChild size="sm">
                <Link href="/radar">
                  <RadarIcon />
                  Browse the radar
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/builder-match">
                  <Gauge />
                  Find my best fit first
                </Link>
              </Button>
            </>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} isSaved />
          ))}
        </div>
      )}
    </>
  );
}
