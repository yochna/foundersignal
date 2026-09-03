import Link from 'next/link';
import {
  ShieldCheck,
  Database,
  Radio,
  Sparkles,
  Users,
  Bookmark,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Rss,
  Github,
  MessageSquare,
  KeyRound,
  ExternalLink,
  Coins,
  ClipboardList,
  Terminal,
  History,
  Globe,
  MousePointerClick,
} from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { KpiTile } from '@/components/radar/kpi-tile';
import { IngestTrigger } from '@/components/admin/ingest-trigger';
import { CallsChart, CostChart } from '@/components/admin/usage-chart';
import { VisitorsChart } from '@/components/admin/visitors-chart';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Meter } from '@/components/ui/progress';
import { AdminManager } from '@/components/admin/admin-manager';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { requireAdmin } from '@/lib/auth';
import { getAdminStats } from '@/lib/admin';
import { repo } from '@/lib/db';
import { adminEmails, hasVercelAnalytics } from '@/lib/config';
import { getWebAnalyticsSummary } from '@/lib/vercel-analytics';
import { formatNumber, formatRelativeTime, formatUsd, truncate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin',
  description: 'Ingestion runs, per-source health, AI usage and cost, all read from the data store.',
};

const RUN_STATUS = {
  success: { icon: CheckCircle2, variant: 'emerald' },
  partial: { icon: AlertTriangle, variant: 'amber' },
  running: { icon: Clock, variant: 'indigo' },
  failed: { icon: XCircle, variant: 'rose' },
};

const SOURCE_ICON = {
  reddit: MessageSquare,
  github: Github,
  stackoverflow: Database,
  hackernews: MessageSquare,
  devto: Sparkles,
  reviews: AlertTriangle,
  regulatory: ShieldCheck,
  workforce: Users,
  launches: Activity,
  rss: Rss,
};

const SOURCE_STATUS = {
  ok: 'emerald',
  empty: 'amber',
  'rate-limited': 'amber',
  blocked: 'rose',
  failed: 'rose',
};

/** One row per configured subsystem, with the tier it is actually running in. */
function ConfigRow({ label, active, activeText, inactiveText, hint }) {
  return (
    <li className="flex items-start gap-2.5 py-2">
      <span
        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
          active ? 'bg-emerald-signal' : 'bg-amber-signal'
        }`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[11px] font-bold text-on-surface">{label}</span>
          <span
            className={`text-[10px] font-bold ${
              active ? 'text-emerald-signal' : 'text-amber-signal'
            }`}
          >
            {active ? activeText : inactiveText}
          </span>
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[10px] leading-snug text-on-surface-variant/85">
            {hint}
          </span>
        ) : null}
      </span>
    </li>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const stats = await getAdminStats({ days: 7 });
  const dbAdmins =
    typeof repo?.getAdminEmails === 'function'
      ? await repo.getAdminEmails().catch(() => [])
      : [];

  // Admin-only Idea Validator log. The repository method is server-side and
  // the page is already protected by requireAdmin(), so validator submissions
  // are never exposed through a public route.
  let validationLog = [];
  try {
    const rows = await repo.listValidationsAdmin(100);
    const userIds = [...new Set(rows.map((row) => row.userId).filter(Boolean))];
    const users = await repo.listUsersByIds(userIds);
    const usersById = new Map(users.map((user) => [user.id, user]));

    validationLog = rows.map((row) => ({
      ...row,
      user: row.userId ? usersById.get(row.userId) || null : null,
    }));
  } catch (error) {
    console.error('[admin] idea validator log failed:', error.message);
  }

  // User activity log: what visitors, signed in or not, are doing on the
  // site. page_view rows are written client-side by ActivityTracker on every
  // route change (see components/analytics/activity-tracker.jsx); other event
  // names can be logged the same way from any route in future.
  let activityLog = [];
  try {
    const rows = await repo.listRecentActivity(100);
    const userIds = [...new Set(rows.map((row) => row.userId).filter(Boolean))];
    const users = await repo.listUsersByIds(userIds);
    const usersById = new Map(users.map((user) => [user.id, user]));
    activityLog = rows.map((row) => ({ ...row, user: row.userId ? usersById.get(row.userId) || null : null }));
  } catch (error) {
    console.error('[admin] activity log failed:', error.message);
  }

  // Visitor analytics: real traffic numbers from the Vercel Web Analytics
  // API. @vercel/analytics (in components/providers.jsx) already tracks
  // every page view automatically — this just reads that data back in so it
  // shows up here instead of only in the Vercel dashboard.
  let webAnalytics = { configured: false };
  try {
    webAnalytics = await getWebAnalyticsSummary({ days: 7 });
  } catch (error) {
    console.error('[admin] web analytics failed:', error.message);
    webAnalytics = { configured: hasVercelAnalytics, ok: false, error: error.message };
  }

  const { config, store, feed, engagement, usage, runs, sourceHealth } = stats;
  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Admin"
        icon={ShieldCheck}
        description="Everything on this page is read from the database. If a number is zero it is because that has genuinely not happened yet, not because the panel is decorative."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/api/health" target="_blank" rel="noreferrer">
              <Activity />
              Raw health JSON
              <ExternalLink />
            </Link>
          </Button>
        }
      />

      {stats.partialErrors.length > 0 ? (
        <ErrorPanel
          error={{
            code: 'DB_UNAVAILABLE',
            message: `${stats.partialErrors.length} panel${
              stats.partialErrors.length === 1 ? '' : 's'
            } could not be loaded from the store.`,
            hint: stats.partialErrors.join(' | '),
          }}
          className="mb-6"
        />
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile
          label="Briefs live"
          value={feed.total}
          icon={Radio}
          accent="primary"
          hint={`${feed.ingestedCount} ingested, ${feed.seedCount} seed`}
        />
        <KpiTile
          label="AI calls (7d)"
          value={usage.totalCalls}
          icon={Sparkles}
          accent="violet"
          hint={`${usage.liveSharePct}% served by the model`}
        />
        <KpiTile
          label="Spend today"
          value={formatUsd(usage.costToday)}
          icon={Coins}
          accent={usage.budgetUsedPct >= 100 ? 'amber' : 'emerald'}
          hint={`${usage.budgetUsedPct}% of the ${formatUsd(usage.budgetUsd)} cap`}
        />
        <KpiTile
          label="Users"
          value={engagement.users}
          icon={Users}
          accent="indigo"
          hint={`${usage.uniqueUsers} active in 7 days`}
        />
        <KpiTile
          label="Saves"
          value={engagement.savedTotal}
          icon={Bookmark}
          accent="emerald"
          hint="Across all watchlists"
        />
        <KpiTile
          label="Validations"
          value={formatNumber(engagement.validationsTotal)}
          icon={Activity}
          accent="neutral"
          hint="Ideas scored to date"
        />
      </div>

      {/* Visitor analytics */}
      <Card tone="glass" className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardEyebrow icon={Globe}>Visitor analytics</CardEyebrow>
            <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-on-surface-variant">
              Real traffic, read live from Vercel Web Analytics. The tracking script is already
              running on every page (@vercel/analytics) &mdash; this panel just surfaces that data
              here instead of only in the Vercel dashboard.
            </p>
          </div>
          {webAnalytics.configured && webAnalytics.ok ? (
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Pageviews (7d)
                </p>
                <p className="mono text-lg font-black text-on-surface">
                  {formatNumber(webAnalytics.pageviews)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Visitors (7d)
                </p>
                <p className="mono text-lg font-black text-on-surface">
                  {formatNumber(webAnalytics.visitors)}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {!webAnalytics.configured ? (
          <div className="mt-4 rounded-xl border border-amber-signal/30 bg-amber-500/5 p-4">
            <p className="text-[11px] font-bold text-amber-signal">Not configured yet</p>
            <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant">
              This reads Vercel&apos;s existing Web Analytics data (no new tracking script needed,
              it&apos;s already running) &mdash; it just needs credentials to query it from here.
              In the Vercel dashboard: enable{' '}
              <span className="font-semibold text-on-surface">Web Analytics</span> for this project,
              then create an access token and set{' '}
              <code className="mono rounded bg-surface-low px-1 py-0.5">VERCEL_ANALYTICS_TOKEN</code>,{' '}
              <code className="mono rounded bg-surface-low px-1 py-0.5">VERCEL_PROJECT_ID</code>, and
              (for team projects) <code className="mono rounded bg-surface-low px-1 py-0.5">VERCEL_TEAM_ID</code>{' '}
              as environment variables.
            </p>
          </div>
        ) : !webAnalytics.ok ? (
          <div className="mt-4 rounded-xl border border-rose-signal/30 bg-rose-500/5 p-4">
            <p className="text-[11px] font-bold text-rose-signal">Could not load Vercel Analytics</p>
            <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant">{webAnalytics.error}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <VisitorsChart daily={webAnalytics.daily} />
            <Card tone="glass" className="p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                Top pages (7d)
              </p>
              {webAnalytics.topRoutes.length === 0 ? (
                <p className="mt-3 text-[11px] text-on-surface-variant">No page views recorded yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {webAnalytics.topRoutes.map((route) => (
                    <li key={route.route} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="mono truncate text-on-surface" title={route.route}>
                        {route.route}
                      </span>
                      <span className="mono shrink-0 text-on-surface-variant">
                        {formatNumber(route.pageviews)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </Card>

      {/* System log */}
      <Card tone="glass" className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardEyebrow icon={Terminal}>System log</CardEyebrow>
            <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-on-surface-variant">
              Recent ingestion activity and admin-side errors. Runtime request logs still live in
              Vercel&apos;s Logs view.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">
              Open Vercel logs
              <ExternalLink />
            </a>
          </Button>
        </div>

        {runs.length === 0 && stats.partialErrors.length === 0 ? (
          <p className="mt-4 text-[11px] text-on-surface-variant">No system events recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 rounded-xl border border-border/60">
            {stats.partialErrors.map((error, index) => (
              <li key={`error-${index}`} className="flex items-start gap-3 bg-rose-500/5 px-3 py-2.5">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-signal" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-rose-signal">Admin panel error</p>
                  <p className="mt-0.5 break-words text-[10px] text-on-surface-variant">{error}</p>
                </div>
              </li>
            ))}
            {runs.slice(0, 8).map((run) => (
              <li key={run.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
                {run.status === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-signal" />
                ) : run.status === 'failed' ? (
                  <XCircle className="h-3.5 w-3.5 text-rose-signal" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-signal" />
                )}
                <span className="text-[10px] font-bold text-on-surface">Ingestion {run.status}</span>
                <span className="mono text-[9px] text-on-surface-variant">
                  {formatRelativeTime(run.startedAt)}
                </span>
                <span className="text-[9px] text-on-surface-variant">
                  {run.signalsCount} signals · {run.opportunitiesCount} briefs
                </span>
                {run.error ? (
                  <span className="min-w-0 flex-1 truncate text-[9px] text-amber-signal">{run.error}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      
      {/* Idea Validator audit log */}
      <Card tone="glass" className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardEyebrow icon={ClipboardList}>Idea Validator log</CardEyebrow>
            <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-on-surface-variant">
              Admin-only audit trail of the latest 100 scored ideas, including the submitted idea,
              user, overall validation score, six dimension scores and timestamp.
            </p>
          </div>
          <Badge variant="outline">{validationLog.length} recent</Badge>
        </div>

        {validationLog.length === 0 ? (
          <p className="mt-4 text-[11px] text-on-surface-variant">
            No Idea Validator submissions have been recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/60 bg-surface-low/50">
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Submitted
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    User
                  </th>
                  <th className="w-[34%] px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Idea
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Score
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Dimensions / 100
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {validationLog.map((row) => {
                  const scores = row.result?.scores || {};
                  const dimensions = [
                    ['D', scores.demand],
                    ['C', scores.competition],
                    ['F', scores.feasibility],
                    ['T', scores.timing],
                    ['I', scores.indiaRelevance],
                    ['R', scores.regulation],
                  ];

                  return (
                    <tr key={row.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-[10px] text-on-surface-variant">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[10px] font-bold text-on-surface">
                          {row.user?.name || 'Unknown user'}
                        </div>
                        <div className="mt-0.5 text-[9px] text-on-surface-variant">
                          {row.user?.email || (row.userId ? truncate(row.userId, 18) : 'Anonymous')}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-xl text-[11px] leading-relaxed text-on-surface">
                          {truncate(row.ideaText || '—', 260)}
                        </p>
                        {row.result?.verdict ? (
                          <p className="mt-1 text-[9px] leading-relaxed text-on-surface-variant">
                            {truncate(row.result.verdict, 180)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span className="mono text-sm font-black text-primary">
                          {row.validationScore ?? '—'}
                        </span>
                        <span className="ml-1 text-[9px] text-on-surface-variant">/100</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {dimensions.map(([label, value]) => (
                            <span
                              key={label}
                              className="rounded-md border border-border/60 bg-surface-low px-1.5 py-1 font-mono text-[9px] text-on-surface-variant"
                              title={label}
                            >
                              {label}: {value ?? '—'}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* User activity log */}
      <Card tone="glass" className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardEyebrow icon={History}>User activity</CardEyebrow>
            <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-on-surface-variant">
              What people are doing on the site, event by event &mdash; page views (signed in or not)
              plus any other action a route records. This complements Visitor analytics above:
              that panel gives you the aggregate numbers, this gives you the attributable trail.
            </p>
          </div>
          <Badge variant="outline">{activityLog.length} recent</Badge>
        </div>

        {activityLog.length === 0 ? (
          <p className="mt-4 text-[11px] text-on-surface-variant">
            No activity recorded yet. Browse the site in another tab and this table fills in within a
            few seconds.
          </p>
        ) : (
          <div className="mt-4 max-h-[420px] overflow-x-auto overflow-y-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="sticky top-0 bg-surface-low/95 backdrop-blur">
                <tr className="border-b border-border/60">
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    When
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    User
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Event
                  </th>
                  <th className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Path
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activityLog.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[10px] text-on-surface-variant">
                      {formatRelativeTime(row.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-[10px]">
                      {row.user ? (
                        <>
                          <div className="font-bold text-on-surface">{row.user.name || 'Unnamed'}</div>
                          <div className="text-on-surface-variant">{row.user.email}</div>
                        </>
                      ) : (
                        <span className="text-on-surface-variant">
                          Anonymous{row.sessionId ? ` \u00b7 ${truncate(row.sessionId, 10)}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <MousePointerClick className="h-3 w-3" />
                        {row.event}
                      </Badge>
                    </td>
                    <td className="mono px-3 py-2.5 text-[10px] text-on-surface-variant">
                      {row.path || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <CallsChart daily={usage.daily} />
        <CostChart daily={usage.daily} budgetUsd={usage.budgetUsd} />
      </div>

      {/* Admin Access Control */}
      <div className="mb-6">
        <AdminManager initialEnvAdmins={adminEmails} initialDbAdmins={dbAdmins} />
      </div>

      {/* Ingestion */}
      <Card tone="glass" className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <CardEyebrow icon={Radio}>Ingestion</CardEyebrow>
            <p className="mt-1.5 max-w-xl text-[11px] leading-relaxed text-on-surface-variant">
              A run queries every source, clusters what it finds, and asks the model to rewrite one
              brief per cluster. Failed sources are skipped and the previous brief is retained, so the
              feed can never shrink because an upstream was down.
              {config.ingestion.cronSecret
                ? ' A daily cron is registered and authenticated.'
                : ' Set CRON_SECRET to enable the scheduled daily run in production.'}
            </p>
          </div>
          <IngestTrigger />
        </div>

        {/* Per-source health and full 6-Category Inventory */}
        <div className="mt-5 border-t border-border/60 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                6-Category Multi-Source Ingestion Pipeline (10 Connectors)
              </p>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                Every ingestion cycle queries all 10 connectors in parallel across technical, regulatory, community, and market launch dimensions.
              </p>
            </div>
            {sourceHealth.asOf ? (
              <p className="text-[10px] text-on-surface-variant/80">
                last run {formatRelativeTime(sourceHealth.asOf)}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: 'stackoverflow', name: 'Stack Overflow', cat: 'Cat 1: Tech & Dev', tier: 'Tier A (P0)', desc: 'UPI, KYC/OCR compliance, Indian SaaS APIs', icon: Database },
              { id: 'github', name: 'GitHub', cat: 'Cat 1: Tech & Dev', tier: 'Tier A (P1)', desc: 'Developer friction repos & tooling gaps', icon: Github },
              { id: 'hackernews', name: 'Hacker News', cat: 'Cat 1: Tech & Dev', tier: 'Tier B (P1)', desc: 'Ask HN & Show HN pain discussions', icon: MessageSquare },
              { id: 'devto', name: 'Dev.to & IndieHackers', cat: 'Cat 1: Tech & Dev', tier: 'Tier B (P1)', desc: 'Builder struggle & workaround articles', icon: Sparkles },
              { id: 'reddit', name: 'Reddit Communities', cat: 'Cat 2: Communities', tier: 'Tier A (P0)', desc: 'r/developersIndia, r/indiastartups, r/solopreneur', icon: MessageSquare },
              { id: 'reviews', name: 'Product Reviews & Switching', cat: 'Cat 3: Reviews', tier: 'Tier B (P1)', desc: 'AlternativeTo, SaaSHub, Trustpilot, G2', icon: AlertTriangle },
              { id: 'regulatory', name: 'Regulatory Portals', cat: 'Cat 4: Regulatory', tier: 'Tier A (P0)', desc: 'RBI, SEBI, IRDAI, PIB Finance & GST Council', icon: ShieldCheck },
              { id: 'workforce', name: 'Workforce & Human Workarounds', cat: 'Cat 5: Workforce', tier: 'Tier B (P1)', desc: 'Upwork & job spikes for manual Excel/KYC/GST tasks', icon: Users },
              { id: 'launches', name: 'Launch & Market Intel', cat: 'Cat 6: Launches', tier: 'Tier B (P1)', desc: 'Product Hunt, YourStory & Entrackr feeds', icon: Activity },
              { id: 'rss', name: 'Indian Tech Feeds', cat: 'Baseline RSS', tier: 'Tier B', desc: 'Financial news and policy RSS channels', icon: Rss },
            ].map((cfg) => {
              const live = sourceHealth.sources?.find((s) => s.name === cfg.id);
              const Icon = cfg.icon;
              const status = live?.status || (live?.items > 0 ? 'ok' : 'ready');

              return (
                <div
                  key={cfg.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-surface-low/60 p-3.5 shadow-sm transition-colors hover:border-primary/40"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
                        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-on-surface truncate block">
                          {cfg.name}
                        </span>
                        <span className="text-[10px] text-primary font-medium">{cfg.cat}</span>
                      </div>
                      <Badge
                        variant={SOURCE_STATUS[status] || 'default'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {status}
                      </Badge>
                    </div>

                    <p className="mt-2 text-[11px] leading-snug text-on-surface-variant">
                      {cfg.desc}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-on-surface-variant font-mono">
                    <span>{cfg.tier}</span>
                    <span>{live ? `${live.items} items \u00b7 ${live.durationMs}ms` : 'Automated connector'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Run history */}
        <div className="mt-5 border-t border-border/60 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Recent runs
          </p>

          {runs.length === 0 ? (
            <p className="mt-3 text-[11px] leading-relaxed text-on-surface-variant">
              No ingestion run has been recorded. The feed is serving bundled seed briefs until the
              first run completes.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border/60">
              {runs.map((run) => {
                const preset = RUN_STATUS[run.status] || RUN_STATUS.partial;
                return (
                  <li key={run.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <Badge variant={preset.variant}>
                      <preset.icon />
                      {run.status}
                    </Badge>
                    <span className="mono text-[10px] text-on-surface-variant">
                      {formatRelativeTime(run.startedAt)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      <span className="mono font-bold">{run.signalsCount}</span> signals
                      {' \u00b7 '}
                      <span className="mono font-bold">{run.opportunitiesCount}</span> briefs
                    </span>
                    {run.error ? (
                      <span className="min-w-0 flex-1 text-[10px] text-amber-signal">
                        {truncate(run.error, 120)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Per-feature usage */}
        <Card tone="glass" className="p-5">
          <CardEyebrow icon={Sparkles}>AI usage by feature (7 days)</CardEyebrow>

          {usage.features.length === 0 ? (
            <p className="mt-3 text-[11px] leading-relaxed text-on-surface-variant">
              No feature has been used in this window yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {usage.features.map((feature) => (
                <li key={feature.feature}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold text-on-surface">{feature.label}</span>
                    <span className="mono text-[10px] text-on-surface-variant">
                      {`${feature.calls} calls \u00b7 ${feature.live} live \u00b7 ${
                        feature.fallback
                      } fallback${feature.cost > 0 ? ` \u00b7 ${formatUsd(feature.cost)}` : ''}`}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      value={feature.calls ? (feature.live / feature.calls) * 100 : 0}
                      color="#10b981"
                      showValue={false}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
            {[
              ['Tokens', formatNumber(usage.tokens)],
              ['Avg latency', `${usage.avgLatencyMs}ms`],
              ['Est. spend', formatUsd(usage.cost)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {label}
                </dt>
                <dd className="mono mt-0.5 text-sm font-bold text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Configuration */}
        <Card tone="glass" className="p-5">
          <CardEyebrow icon={KeyRound}>Configuration</CardEyebrow>
          <p className="mt-1.5 text-[10px] leading-relaxed text-on-surface-variant/85">
            Which tier each subsystem is running in right now. Amber is not an error: it means a
            documented fallback is active.
          </p>

          <ul className="mt-3 divide-y divide-border/60">
            <ConfigRow
              label="Data store"
              active={store.driver === 'supabase'}
              activeText="Supabase Postgres"
              inactiveText={store.driver === 'memory' ? 'in-memory, not persistent' : 'local file store'}
              hint={
                store.driver === 'supabase'
                  ? `Reachable, ${store.rows ?? 0} briefs, ${store.latencyMs ?? 0}ms`
                  : store.location || 'Set the Supabase env vars for durable storage'
              }
            />
            <ConfigRow
              label="AI model"
              active={config.ai.gemini}
              activeText={config.ai.model}
              inactiveText="not configured, heuristics only"
              hint={
                config.ai.gemini
                  ? `Daily cap ${formatUsd(usage.budgetUsd)}; per-feature limits are enforced per user`
                  : 'Set GEMINI_API_KEY to enable live analysis and brief enrichment'
              }
            />
            <ConfigRow
              label="Authentication"
              active={config.auth.google}
              activeText="Google OAuth"
              inactiveText="demo login only"
              hint={
                config.auth.adminEmails > 0
                  ? `${config.auth.adminEmails} admin email${config.auth.adminEmails === 1 ? '' : 's'} configured`
                  : 'ADMIN_EMAILS is empty, so any signed-in user can reach this page'
              }
            />
            <ConfigRow
              label="Reddit"
              active={config.sources.redditAuth}
              activeText="OAuth credentials"
              inactiveText="public endpoint"
              hint="Reddit blocks unauthenticated requests from most hosting IPs, so a deployed instance needs credentials"
            />
            <ConfigRow
              label="GitHub"
              active={config.sources.githubToken}
              activeText="token"
              inactiveText="anonymous"
              hint="Anonymous search is capped at roughly 10 requests per minute"
            />
            <ConfigRow
              label="Regulator feeds"
              active={config.sources.rssFeeds > 0}
              activeText={`${config.sources.rssFeeds} feeds`}
              inactiveText="none configured"
              hint="RBI and SEBI RSS need no credentials"
            />
            <ConfigRow
              label="Scheduled ingestion"
              active={config.ingestion.cronSecret}
              activeText="cron secret set"
              inactiveText="manual only"
              hint="vercel.json registers a daily 02:00 UTC run"
            />
            <ConfigRow
              label="Session secret"
              active={config.auth.secretConfigured}
              activeText="configured"
              inactiveText="development fallback"
              hint="NEXTAUTH_SECRET must be set before any real deployment"
            />
          </ul>
        </Card>
      </div>

      {/* Raw signals */}
      <Card tone="glass" className="mt-4 p-5">
        <CardEyebrow icon={Database}>Latest raw signals</CardEyebrow>
        <p className="mt-1.5 text-[10px] leading-relaxed text-on-surface-variant/85">
          The unprocessed evidence behind the briefs, exactly as the connectors returned it.
        </p>

        {stats.recentSignals.length === 0 ? (
          <p className="mt-3 text-[11px] leading-relaxed text-on-surface-variant">
            No raw signals stored yet. They are written on every ingestion run.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {stats.recentSignals.map((signal) => (
              <li key={signal.id} className="py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{signal.source}</Badge>
                  {signal.clusterId ? (
                    <span className="mono text-[9px] text-on-surface-variant/70">
                      {signal.clusterId}
                    </span>
                  ) : null}
                  {signal.publishedAt ? (
                    <span className="mono ml-auto text-[9px] text-on-surface-variant/70">
                      {signal.publishedAt}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                  {signal.url ? (
                    <a
                      href={signal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {truncate(signal.text, 220)}
                    </a>
                  ) : (
                    truncate(signal.text, 220)
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
