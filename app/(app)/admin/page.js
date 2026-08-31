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
} from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { KpiTile } from '@/components/radar/kpi-tile';
import { IngestTrigger } from '@/components/admin/ingest-trigger';
import { CallsChart, CostChart } from '@/components/admin/usage-chart';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Meter } from '@/components/ui/progress';
import { AdminManager } from '@/components/admin/admin-manager';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { requireAdmin } from '@/lib/auth';
import { getAdminStats } from '@/lib/admin';
import { repo } from '@/lib/db';
import { adminEmails } from '@/lib/config';
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
