import Link from 'next/link';
import {
  Radar as RadarIcon,
  Flame,
  TrendingUp,
  Gauge,
  Scale,
  Radio,
  SearchX,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { KpiTile } from '@/components/radar/kpi-tile';
import { SectorChart } from '@/components/radar/sector-chart';
import { FilterBar } from '@/components/radar/filter-bar';
import { OpportunityCard } from '@/components/opportunity/opportunity-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { computeStats, loadOpportunities, queryOpportunities, calculateFounderFit } from '@/lib/opportunities';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Opportunity Radar',
  description:
    'Scored Indian startup opportunities built from hiring, regulatory, community and technology signals.',
};

export default async function RadarPage({ searchParams }) {
  const { opportunities, source } = await loadOpportunities();
  const user = await getCurrentUser();

  let profile = null;
  let savedIds = new Set();
  if (user) {
    try {
      [profile, savedIds] = await Promise.all([
        repo.getProfile(user.id).catch(() => null),
        repo.listSaved(user.id).then((ids) => new Set(ids)).catch(() => new Set()),
      ]);
    } catch {
      // Degrade gracefully
    }
  }

  // Enrich opportunities with dynamic founder fit score if profile exists
  const personalizedOpps = opportunities.map((opp) => {
    const fit = calculateFounderFit(opp, profile);
    if (!fit) return opp;
    return {
      ...opp,
      founderFit: fit.fitScore,
      founderFitReason: fit.reason,
    };
  });

  const stats = computeStats(personalizedOpps);

  const defaultSort = profile?.onboardingComplete ? 'recommended' : 'score';
  const sortOption = searchParams?.sort || defaultSort;

  const { rows } = queryOpportunities(personalizedOpps, {
    q: searchParams?.q || '',
    vertical: searchParams?.vertical || 'all',
    momentum: searchParams?.momentum || 'all',
    sort: sortOption,
  });

  const isSeedData = source !== 'store';

  return (
    <>
      <PageHeader
        eyebrow="Opportunity intelligence"
        title="Opportunity Radar"
        icon={RadarIcon}
        description="Every brief below is a cluster of independent market signals, scored on demand, hiring, regulation, skills scarcity, competition, timing and India relevance."
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/idea-validator">
                <Sparkles />
                Validate my own idea
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/builder-match">
                <Gauge />
                Find my best fit
              </Link>
            </Button>
          </>
        }
      />

      {/* Bento KPI grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
        <KpiTile
          label="Live opportunities"
          value={stats.total}
          icon={RadarIcon}
          accent="primary"
          hint={
            stats.lastUpdated
              ? `Feed updated ${formatRelativeTime(stats.lastUpdated)}`
              : 'Awaiting first ingestion run'
          }
        />
        <KpiTile
          label="Critical signals"
          value={stats.critical}
          icon={Flame}
          accent="emerald"
          hint="Score of 90 or above"
        />
        <KpiTile
          label="Rising momentum"
          value={stats.rising}
          icon={TrendingUp}
          accent="violet"
          hint={
            stats.topMover
              ? `Top mover +${stats.topMover.changePercentage}%`
              : 'Signal volume growing'
          }
        />
        <KpiTile
          label="Average score"
          value={stats.avgScore}
          unit="/100"
          icon={Gauge}
          accent="indigo"
          hint="Across the whole feed"
        />
        <KpiTile
          label="Regulation driven"
          value={stats.regulatoryDriven}
          icon={Scale}
          accent="amber"
          hint="Regulatory pressure 85+"
        />
        <KpiTile
          label="Signals analysed"
          value={formatNumber(stats.totalSignals)}
          icon={Radio}
          accent="neutral"
          hint="Aggregated evidence items"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <SectorChart verticals={stats.verticals} className="lg:col-span-2" />

        <Card tone="glass" className="p-5">
          <CardEyebrow icon={Sparkles}>How to read a score</CardEyebrow>
          <ul className="mt-3 space-y-2.5">
            {[
              { range: '90-100', label: 'Critical signal', note: 'Converging evidence across every source type.', color: '#10b981' },
              { range: '80-89', label: 'High confidence', note: 'Strong demand with a defensible entry point.', color: '#8b5cf6' },
              { range: '70-79', label: 'Emerging driver', note: 'Real but early; expect to educate the buyer.', color: '#6366f1' },
              { range: 'Below 70', label: 'Exploratory', note: 'Watch it, do not build on it yet.', color: '#f59e0b' },
            ].map((row) => (
              <li key={row.range} className="flex items-start gap-2.5">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="flex items-baseline gap-1.5">
                    <span className="mono text-[11px] font-bold text-on-surface">{row.range}</span>
                    <span className="text-[11px] font-bold text-on-surface-variant">{row.label}</span>
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-on-surface-variant/85">
                    {row.note}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {isSeedData ? (
        <div className="glass mb-6 flex flex-wrap items-center gap-3 rounded-xl border-primary/25 p-4">
          <Badge variant="primary">
            <Sparkles />
            Seed data
          </Badge>
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-surface-variant">
            You are viewing the ten bundled starter briefs because the database has no ingested records
            yet. Trigger a run from the admin dashboard, or with{' '}
            <span className="mono font-bold">npm run ingest</span>, to replace these with live signals.
          </p>
          <Button asChild size="sm" variant="secondary">
            <Link href="/admin">
              Open admin
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      ) : null}

      <FilterBar total={stats.total} returned={rows.length} />

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No opportunities match those filters"
          description="Nothing in the current feed matches this combination. Widen the sector or momentum filter, or clear the search term."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/radar">Reset filters</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              isSaved={savedIds.has(opportunity.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
