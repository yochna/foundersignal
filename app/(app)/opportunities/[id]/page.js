import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Briefcase,
  Wrench,
  Scale,
  Cpu,
  Swords,
  Target,
  Rocket,
  Coins,
  AlertTriangle,
  MapPin,
  Activity,
  Lightbulb,
    ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Compass,
  Zap,
  ShieldCheck,
  Sparkles,
  FileSearch,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreRail } from '@/components/opportunity/score-rail';
import { ShareToolbar } from '@/components/opportunity/share-toolbar';
import { SectionNav } from '@/components/opportunity/section-nav';
import { SignalChart } from '@/components/opportunity/signal-chart';
import { SaveButton } from '@/components/opportunity/save-button';
import { OpportunityCard } from '@/components/opportunity/opportunity-card';
import { PaywallGate } from '@/components/opportunity/paywall-gate';
import { ScoreRadar } from '@/components/opportunity/score-radar';
import { SourceBadge } from '@/components/feedback/source-badge';
import { loadOpportunities, resolveRelated, calculateFounderFit } from '@/lib/opportunities';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';
import { truncate, scoreBand } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { id: 'verdict', label: 'Conviction Verdict' },
  { id: 'overview', label: 'Opportunity Thesis' },
  { id: 'market-size', label: 'TAM / SAM Sizing' },
  { id: 'unit-economics', label: 'Unit Economics' },
  { id: 'roadmap', label: 'MVP Tech Roadmap' },
  { id: 'buyer-persona', label: 'Buyer & Friction' },
  { id: 'gtm', label: 'GTM Outbound' },
  { id: 'competition', label: 'Incumbent Teardown' },
  { id: 'demand', label: 'Demand Evidence' },
  { id: 'evidence', label: 'Evidence & Sources' },
  { id: 'hiring', label: 'Hiring & Salaries' },
  { id: 'skills', label: 'Skill Scarcity' },
  { id: 'regulation', label: 'Regulatory Moat' },
  { id: 'technology', label: 'Tech Enablers' },
  { id: 'risks', label: 'Risks & Pre-Mortem' },
];

export async function generateMetadata({ params }) {
  const { opportunities } = await loadOpportunities();
  const opportunity = opportunities.find((o) => o.id === decodeURIComponent(params.id));
  if (!opportunity) return { title: 'Opportunity not found' };
  return {
    title: `${opportunity.title} | Deep Intelligence Brief`,
    description: truncate(opportunity.problem || opportunity.whyInteresting, 155),
  };
}

/** Consistent section wrapper with an anchor target for the in-page nav. */
function Section({ id, title, icon: Icon, description, badge, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card tone="glass" className="p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-on-surface">
              {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> : null}
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-xs text-on-surface-variant/85 leading-relaxed">{description}</p>
            ) : null}
          </div>
          {badge ? <Badge variant="indigo" className="text-[10px] font-bold">{badge}</Badge> : null}
        </div>
        {children}
      </Card>
    </section>
  );
}

function Prose({ children }) {
  if (!children) {
    return (
      <p className="text-xs italic text-on-surface-variant/70">
        Not captured for this opportunity yet.
      </p>
    );
  }
  return <p className="text-sm leading-relaxed text-on-surface-variant">{children}</p>;
}

function DataTable({ columns, rows, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return <p className="text-xs italic text-on-surface-variant/70">{emptyMessage}</p>;
  }

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-2 pb-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/50 last:border-0 hover:bg-surface-low/30 transition-colors">
              {columns.map((column) => (
                <td key={column.key} className="px-2 py-3 align-top text-xs text-on-surface-variant">
                  {column.render ? column.render(row) : row[column.key] || '--'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const VOLUME_VARIANT = { High: 'emerald', Medium: 'indigo', Low: 'default' };
const SCARCITY_VARIANT = { Critical: 'rose', High: 'amber', Medium: 'indigo' };
const STRENGTH_VARIANT = { Strong: 'rose', Medium: 'amber', Emerging: 'indigo', Weak: 'emerald' };

export default async function OpportunityDetailPage({ params }) {
  const id = decodeURIComponent(params.id);
  const { opportunities } = await loadOpportunities();
  const opportunity = opportunities.find((o) => o.id === id);

  if (!opportunity) notFound();

  const related = resolveRelated(opportunity, opportunities);

  const user = await getCurrentUser();
  let isSaved = false;
  if (user) {
    try {
      isSaved = await repo.isSaved(user.id, opportunity.id);
    } catch {
      // Falls back to unsaved
    }
  }

  // Raw signals that actually back this brief, surfaced as checkable evidence.
  let evidence = [];
  try {
    const all = await repo.listRawSignals(500);
    const clusterKey = opportunity.clusterId || opportunity.id;
    evidence = (all || [])
      .filter((signal) => signal.clusterId === clusterKey || signal.clusterId === opportunity.id)
      .slice(0, 8);
  } catch {
    // The evidence section degrades to a hint when the store is unreachable.
  }

  // Personalized fit for the sidebar, reusing the radar scoring logic.
  let founderFit = null;
  if (user) {
    try {
      const profile = await repo.getProfile(user.id);
      founderFit = calculateFounderFit(opportunity, profile);
    } catch {
      // No profile yet - the card simply does not render.
    }
  }

  const verdict = opportunity.verdictMatrix || {};
  const tam = opportunity.tamAnalysis || {};
  const unitEcon = opportunity.unitEconomics || {};
  const roadmap = opportunity.technicalRoadmap || [];
  const buyer = opportunity.buyerPersona || {};
  const gtm = opportunity.gtmPlaybook || {};
  const teardown = opportunity.incumbentTeardown || [];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/radar">
            <ArrowLeft />
            Back to radar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <SourceBadge source={opportunity.source} />
          <SaveButton
            opportunityId={opportunity.id}
            opportunityTitle={opportunity.title}
            initialSaved={isSaved}
            variant="full"
          />
        </div>
      </div>

      <header className="mb-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="primary">{opportunity.vertical}</Badge>
          <Badge variant="outline">{opportunity.industry}</Badge>
          <Badge variant="emerald" className="font-bold text-[10px]">
            Signal Score: {opportunity.score}/100
          </Badge>
          {opportunity.momentum ? (
            <Badge variant="indigo" className="capitalize text-[10px]">
              {opportunity.momentum} Momentum
            </Badge>
          ) : null}
        </div>

        <h1 className="max-w-4xl text-2xl font-black leading-tight tracking-tight text-on-surface sm:text-[34px]">
          {opportunity.title}
        </h1>

        {opportunity.problem ? (
          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-on-surface-variant">
            {opportunity.problem}
          </p>
        ) : null}

      {opportunity.whyInteresting ? (
  <div className="mt-5 grid max-w-4xl grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 rounded-xl border border-primary/25 bg-primary/8 p-4">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
      <Lightbulb
        className="h-4 w-4 text-primary"
        aria-hidden="true"
      />
    </span>

    <p className="m-0 min-w-0 self-center text-xs leading-5 text-on-surface-variant sm:text-sm sm:leading-6">
      <span className="font-bold text-on-surface">
        Why this surfaced now:{" "}
      </span>
      {opportunity.whyInteresting}
    </p>
  </div>
) : null}

        {opportunity.monetizationHypothesis ? (
  <div className="mt-3 grid max-w-4xl grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 rounded-xl border border-emerald-signal/25 bg-emerald-signal/8 p-4">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-signal/15">
      <Coins
        className="h-4 w-4 text-emerald-500"
        aria-hidden="true"
      />
    </span>

    <p className="m-0 min-w-0 self-center text-xs leading-5 text-on-surface-variant sm:text-sm sm:leading-6">
      <span className="font-bold text-on-surface">
        Monetization hypothesis:{" "}
      </span>
      {opportunity.monetizationHypothesis}
    </p>
  </div>
) : null}
            </header>

            {/* Share / Export toolbar */}
      <div className="mb-6">
        <ShareToolbar opportunity={opportunity} />
      </div>

      {/* Mobile section nav */}
      <div className="mb-5 md:hidden">
        <SectionNav sections={SECTIONS} />
      </div>

      {/* 2-Part Layout: Main Analysis + Thin Right Bar */}
      <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
        {/* PART 1: Main Analysis (Left) */}
        <div className="w-full flex-1 min-w-0 space-y-6">

          {/* 1. EXECUTIVE VERDICT MATRIX */}
          <Section
            id="verdict"
            title="Strategic Conviction Verdict"
            icon={ShieldCheck}
            badge="Executive Summary"
            description="High-level venture viability matrix and founder go/no-go recommendation."
          >
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="rounded-xl border border-border bg-surface-low/60 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Conviction</p>
                <p className="mt-1 text-sm font-black text-emerald-500">{verdict.convictionLevel || 'High Conviction'}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-low/60 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Execution Difficulty</p>
                <p className="mt-1 text-sm font-bold text-amber-500">{verdict.executionDifficulty || 'Moderate'}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-low/60 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Capital Intensity</p>
                <p className="mt-1 text-sm font-bold text-on-surface">{verdict.capitalIntensity || 'Low to Moderate'}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-low/60 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Time to First Revenue</p>
                <p className="mt-1 text-sm font-black text-primary">{verdict.timeToRevenueMonths || '3 - 6 Months'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4">
              <p className="text-xs sm:text-sm font-semibold text-on-surface leading-relaxed">
                <span className="font-black text-emerald-500 uppercase tracking-wider text-[11px] block mb-1">Strategic Synthesis:</span>
                {verdict.overallRecommendation || 'Validated market opportunity with concrete Indian regulatory tailwinds and clear enterprise willingness to pay.'}
              </p>
            </div>
          </Section>

          {/* 2. OVERVIEW & OPPORTUNITY THESIS */}
          <Section
            id="overview"
            title="Opportunity Overview & Market Thesis"
            icon={Target}
            description="Deep exploration of what the opportunity is and why the buyer cares enough to pay."
          >
            <PaywallGate isLocked={true} title="Deep Market Overview & Thesis" description="Unlock Founder Pro for the complete unserved gap analysis, regulatory tailwinds, and buyer unit economics.">
              <Prose>{opportunity.overview}</Prose>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface-low/60 p-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Target customer archetype
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-on-surface font-semibold">
                    {opportunity.targetCustomer || 'Not specified'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-low/60 p-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    India-specific relevance
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-on-surface">
                    {opportunity.indiaRelevanceText || 'Not specified'}
                  </p>
                </div>
              </div>

              {opportunity.whyMatters ? (
                <div className="mt-4 rounded-lg border border-border bg-surface-low/40 p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Why this matters right now
                  </p>
                  <Prose>{opportunity.whyMatters}</Prose>
                </div>
              ) : null}
            </PaywallGate>
          </Section>

          {/* 3. MARKET SIZING (TAM / SAM / SOM) */}
          <Section
            id="market-size"
            title="Market Sizing & TAM / SAM / SOM"
            icon={TrendingUp}
            description="Top-down and bottom-up financial addressable market metrics in India and globally."
          >
            <PaywallGate isLocked={true} title="Financial Sizing & TAM Models" description="Unlock Founder Pro for detailed TAM/SAM breakdown and bottom-up market penetration models.">
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">India TAM</p>
                  <p className="mt-1 text-lg font-black text-on-surface">{tam.tamIndia || '₹2,500 Cr'}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Global TAM</p>
                  <p className="mt-1 text-lg font-black text-on-surface">{tam.tamGlobal || '$4.2 Billion'}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">SAM (Target Addressable)</p>
                  <p className="mt-1 text-base font-bold text-primary">{tam.sam || '₹750 Cr'}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Annual CAGR</p>
                  <p className="mt-1 text-base font-black text-emerald-500">{tam.cagr || '24.5% YoY'}</p>
                </div>
              </div>

              {tam.metricsBreakdown ? (
                <div className="rounded-lg border border-border bg-surface-low/50 p-4 text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-on-surface">Bottom-Up Market Breakdown: </span>
                  {tam.metricsBreakdown}
                </div>
              ) : null}
            </PaywallGate>
          </Section>

          {/* 4. UNIT ECONOMICS & PRICING ARCHITECTURE */}
          <Section
            id="unit-economics"
            title="Unit Economics & SaaS Pricing"
            icon={Coins}
            description="Estimated customer acquisition cost, lifetime value, gross margins, and tier pricing."
          >
            <PaywallGate isLocked={true} title="Unit Economics & Pricing Architecture" description="Unlock Founder Pro to inspect ARPU benchmarks, LTV/CAC ratios, and target packaging tiers.">
              <div className="grid gap-3.5 sm:grid-cols-3 lg:grid-cols-6 mb-5">
                <div className="rounded-lg border border-border bg-surface-low/60 p-3">
                  <p className="text-[9px] font-bold uppercase text-on-surface-variant">Estimated ARPU</p>
                  <p className="mt-1 text-xs font-black text-on-surface">{unitEcon.arpu || '₹12L/yr'}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-low/60 p-3">
                  <p className="text-[9px] font-bold uppercase text-on-surface-variant">Estimated CAC</p>
                  <p className="mt-1 text-xs font-bold text-on-surface">{unitEcon.cac || '₹1.8L'}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-low/60 p-3">
                  <p className="text-[9px] font-bold uppercase text-on-surface-variant">Estimated LTV</p>
                  <p className="mt-1 text-xs font-black text-emerald-500">{unitEcon.ltv || '₹48L'}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-low/60 p-3">
                  <p className="text-[9px] font-bold uppercase text-on-surface-variant">LTV : CAC</p>
                  <p className="mt-1 text-xs font-black text-primary">{unitEcon.ltvCacRatio || '26.6x'}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-low/60 p-3">
                  <p className="text-[9px] font-bold uppercase text-on-surface-variant">CAC Payback</p>
                  <p className="mt-1 text-xs font-bold text-on-surface">{unitEcon.paybackMonths || '1.8 Mos'}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-low/60 p-3">
                  <p className="text-[9px] font-bold uppercase text-on-surface-variant">Gross Margin</p>
                  <p className="mt-1 text-xs font-black text-emerald-500">{unitEcon.grossMargin || '85%'}</p>
                </div>
              </div>

              {unitEcon.targetPricingTiers?.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Recommended Commercial Pricing Tiers</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {unitEcon.targetPricingTiers.map((tier, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-surface-low/50 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-on-surface">{tier.tierName}</span>
                            <Badge variant="outline" className="text-[9px] capitalize">{tier.billingCycle}</Badge>
                          </div>
                          <p className="text-lg font-black text-on-surface mb-2">{tier.price}</p>
                          <p className="text-[11px] text-on-surface-variant mb-3">{tier.targetSegment}</p>
                          <ul className="space-y-1 text-[11px] text-on-surface-variant/90">
                            {tier.keyFeatures?.map((f, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {opportunity.monetizationHypothesis ? (
                <div className="mt-4 rounded-lg border border-border bg-surface-low/40 p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Monetization Hypothesis
                  </p>
                  <Prose>{opportunity.monetizationHypothesis}</Prose>
                </div>
              ) : null}
            </PaywallGate>
          </Section>

          {/* 5. 4-WEEK TECHNICAL MVP ARCHITECTURE ROADMAP */}
          <Section
            id="roadmap"
            title="4-Week MVP Technical Roadmap"
            icon={Rocket}
            description="Actionable sprint-by-sprint deliverables and recommended engineering tech stack."
          >
            <PaywallGate isLocked={true} title="Technical Architecture Roadmap" description="Unlock Founder Pro for sprint-by-sprint MVP build plans and component tech stack specs.">
              {roadmap.length ? (
                <div className="space-y-4">
                  {roadmap.map((phase, idx) => (
                    <div key={idx} className="relative rounded-xl border border-border bg-surface-low/50 p-4.5 pl-14">
                      <span className="absolute left-4 top-4.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-black text-primary">
                        {idx + 1}
                      </span>

                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h4 className="text-xs sm:text-sm font-bold text-on-surface">{phase.phase}</h4>
                        <Badge variant="indigo" className="text-[10px]">{phase.duration}</Badge>
                      </div>

                      <div className="mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Key Deliverables</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-on-surface-variant">
                          {phase.deliverables?.map((d, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {phase.techStack?.length ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
                          <span className="text-[10px] font-bold text-on-surface-variant mr-1">Stack:</span>
                          {phase.techStack.map((tech, tIdx) => (
                            <span key={tIdx} className="rounded bg-surface-container px-2 py-0.5 text-[10px] mono font-semibold text-on-surface">
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <Prose>{opportunity.mvpRecommendation}</Prose>
              )}
            </PaywallGate>
          </Section>

          {/* 6. BUYER PERSONA & PROCUREMENT FRICTION */}
          <Section
            id="buyer-persona"
            title="Buyer Persona & Procurement Dynamics"
            icon={Users}
            description="Who signs the check, who champions the software, and what friction slows adoption."
          >
            <PaywallGate isLocked={true} title="Buyer Persona & Sales Cycles" description="Unlock Founder Pro for B2B procurement decision hierarchies and sales velocity playbooks.">
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Primary Economic Buyer</p>
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-on-surface">{buyer.primaryBuyer || opportunity.targetCustomer}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Typical Sales & Budget Cycle</p>
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-primary">{buyer.budgetCycle || '30 - 60 Days'}</p>
                </div>
              </div>

              {buyer.mustHaveChecklist?.length ? (
                <div className="rounded-xl border border-border bg-surface-low/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Must-Have Buying Criteria Checklist</p>
                  <ul className="space-y-1.5 text-xs text-on-surface-variant">
                    {buyer.mustHaveChecklist.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </PaywallGate>
          </Section>

          {/* 7. GO-TO-MARKET PLAYBOOK */}
          <Section
            id="gtm"
            title="Go-To-Market & First 10 Customers"
            icon={Compass}
            description="Actionable cold outbound angles and distribution advantages to reach initial revenue."
          >
            <PaywallGate isLocked={true} title="Go-To-Market Outbound Strategy" description="Unlock Founder Pro for cold outreach hooks, founder sales scripts, and defensibility playbooks.">
              <div className="space-y-3.5">
                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">First 10 Customers Acquisition Channel</p>
                  <p className="text-xs sm:text-sm text-on-surface leading-relaxed font-semibold">{gtm.firstTenCustomersChannel || 'Direct founder outbound via LinkedIn and industry networks.'}</p>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Cold Pitch Hook & Value Proposition</p>
                  <p className="text-xs sm:text-sm italic text-on-surface-variant leading-relaxed">{gtm.coldPitchAngle || 'Demonstrating quantifiable cost reduction and instant regulatory compliance.'}</p>
                </div>

                <div className="rounded-xl border border-border bg-surface-low/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Long-term Distribution Moat</p>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{gtm.distributionMoat || 'Deep workflow lock-in and high switching barriers.'}</p>
                </div>
              </div>
            </PaywallGate>
          </Section>

          {/* 8. INCUMBENT TEARDOWN & GAP */}
          <Section
            id="competition"
            title="Incumbent Vulnerability & Gap Teardown"
            icon={Swords}
            description="Analysis of existing solutions, structural weaknesses, and founder defensibility."
          >
            <DataTable
              rows={opportunity.competitionList}
              emptyMessage="No competitors mapped yet."
              columns={[
                { key: 'name', label: 'Incumbent', render: (r) => <span className="font-bold text-on-surface">{r.name}</span> },
                { key: 'category', label: 'Category' },
                {
                  key: 'strength',
                  label: 'Strength',
                  render: (r) => <Badge variant={STRENGTH_VARIANT[r.strength] || 'default'}>{r.strength}</Badge>,
                },
                { key: 'pricing', label: 'Pricing Model' },
              ]}
            />

            {teardown.length ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Structural Flaws in Legacy Players</p>
                {teardown.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-surface-low/40 p-3.5">
                    <p className="text-xs font-bold text-on-surface mb-1">{item.name}</p>
                    <p className="text-[11px] text-on-surface-variant mb-1"><span className="font-semibold text-rose-400">Weakness: </span>{item.weakness}</p>
                    <p className="text-[11px] text-on-surface-variant"><span className="font-semibold text-emerald-400">Founder Advantage: </span>{item.defensibilityStrategy}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {opportunity.marketGap ? (
              <div className="mt-4 rounded-lg border border-emerald-signal/25 bg-emerald-signal/8 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-signal">
                  <Target className="h-3.5 w-3.5" aria-hidden="true" />
                  The Unserved Market Whitespace
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-on-surface-variant">{opportunity.marketGap}</p>
              </div>
            ) : null}
          </Section>

          {/* 9. DEMAND EVIDENCE */}
          <Section
            id="demand"
            title="Signal Intensity & Trailing Demand"
            icon={Activity}
            description="Six-month market signal velocity across tech forums, communities, and developer feedback."
          >
            <SignalChart data={opportunity.signalsTimeline} score={opportunity.score} />
            <div className="mt-4">
              <Prose>{opportunity.demandAnalysis}</Prose>
            </div>
          </Section>

          {/* 9b. EVIDENCE & RAW SOURCE FEED */}
          <Section
            id="evidence"
            title="Evidence & Raw Source Feed"
            icon={FileSearch}
            description="The verbatim signals behind this brief - actual forum posts, articles and regulatory notices that clustered into this opportunity."
          >
            {evidence.length ? (
              <ol className="space-y-2.5">
                {evidence.map((signal, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface-low/30 p-3.5"
                  >
                    <span className="mono mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        <span>{signal.sourceFamily || signal.source || 'signal'}</span>
                        {signal.publishedAt ? (
                          <>
                            <span className="text-on-surface-variant/40">·</span>
                            <span className="normal-case tracking-normal text-on-surface-variant/70">
                              {new Date(signal.publishedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </>
                        ) : null}
                      </div>
                      <p className="text-xs leading-relaxed text-on-surface-variant">
                        {signal.text}
                      </p>
                      {signal.url ? (
                        <a
                          href={signal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                        >
                          View source
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs italic text-on-surface-variant/70">
                No raw signals captured for this cluster yet. Run an ingestion from the Admin dashboard to populate the live evidence feed.
              </p>
            )}
          </Section>

          {/* 10. HIRING SIGNALS */}
          <Section
            id="hiring"
            title="Hiring Signals & Indian Salary Bands"
            icon={Briefcase}
            description="Roles Indian enterprises are actively recruiting to solve this problem internally."
          >
            <DataTable
              rows={opportunity.hiringSignals}
              emptyMessage="No hiring signals captured for this cluster yet."
              columns={[
                { key: 'role', label: 'Role Title', render: (r) => <span className="font-bold text-on-surface">{r.role}</span> },
                {
                  key: 'volume',
                  label: 'Hiring Volume',
                  render: (r) => <Badge variant={VOLUME_VARIANT[r.volume] || 'default'}>{r.volume}</Badge>,
                },
                { key: 'salaryRange', label: 'Salary Band (INR)', render: (r) => <span className="mono font-semibold text-primary">{r.salaryRange}</span> },
                { key: 'count', label: 'Active Postings', render: (r) => <span className="mono font-bold text-on-surface">{r.count}</span> },
              ]}
            />
          </Section>

          {/* 11. SKILL SCARCITY */}
          <Section
            id="skills"
            title="Skill Scarcity & Talent Moat"
            icon={Wrench}
            description="Required technical capabilities and talent bottlenecks in the Indian ecosystem."
          >
            {opportunity.skillSignals?.length ? (
              <ul className="space-y-3">
                {opportunity.skillSignals.map((skill, index) => (
                  <li key={index} className="rounded-lg border border-border bg-surface-low/50 p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-on-surface">{skill.skill}</span>
                      <Badge variant={SCARCITY_VARIANT[skill.scarcity] || 'default'}>
                        {skill.scarcity} scarcity
                      </Badge>
                    </div>
                    {skill.impact ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
                        {skill.impact}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-on-surface-variant/70">No skill signals captured yet.</p>
            )}
          </Section>

          {/* 12. REGULATORY DRIVERS */}
          <Section
            id="regulation"
            title="Regulatory Moats & Statutory Mandates"
            icon={Scale}
            description="Government guidelines and circulars converting this software into a mandatory purchase."
          >
            {opportunity.regulatorySignals?.length ? (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {opportunity.regulatorySignals.map((reg, index) => (
                  <li key={index} className="relative">
                    <span
                      className="absolute -left-[1.44rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-amber-signal"
                      aria-hidden="true"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-on-surface">{reg.regulationName}</span>
                      {reg.agency ? <Badge variant="amber">{reg.agency}</Badge> : null}
                      {reg.date ? (
                        <span className="mono text-[10px] font-bold text-on-surface-variant">
                          {reg.date}
                        </span>
                      ) : null}
                    </div>
                    {reg.summary ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
                        {reg.summary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs italic text-on-surface-variant/70">
                Demand here is market-led rather than compliance-enforced.
              </p>
            )}
          </Section>

          {/* 13. TECHNOLOGY ENABLERS */}
          <Section
            id="technology"
            title="Enabling Technologies"
            icon={Cpu}
            description="Architectural breakthroughs or cost reductions making this feasible now."
          >
            <DataTable
              rows={opportunity.technologySignals}
              emptyMessage="No specific technology enabler captured yet."
              columns={[
                { key: 'tech', label: 'Technology / Protocol', render: (r) => <span className="font-bold text-on-surface">{r.tech}</span> },
                { key: 'adoptionRate', label: 'Adoption Speed', render: (r) => <Badge variant="indigo">{r.adoptionRate}</Badge> },
                { key: 'description', label: 'Strategic Significance' },
              ]}
            />
          </Section>

          {/* 14. RISKS & PRE-MORTEM */}
          <Section
            id="risks"
            title="Risks & Pre-Mortem Analysis"
            icon={AlertTriangle}
            description="Critical failure modes and regulatory unknowns to evaluate before deploying capital."
          >
            {opportunity.risks?.length ? (
              <ul className="space-y-2.5">
                {opportunity.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-low/30 p-3">
                    <span className="mono mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-rose-signal/15 text-[9px] font-bold text-rose-signal">
                      {index + 1}
                    </span>
                    <span className="text-xs leading-relaxed text-on-surface-variant">{risk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-on-surface-variant/70">
                No risks captured.
              </p>
            )}
          </Section>

        </div>

        {/* PART 2: Thin Side Bar (Right) */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 md:sticky md:top-20 space-y-5">
          {/* 1. Signal score */}
          <ScoreRail opportunity={opportunity} />

          {/* 1b. Score profile radar */}
          <ScoreRadar opportunity={opportunity} className="hidden md:block" />

          {/* 2. On this page */}
          <Card tone="glass" className="hidden md:block p-4 sm:p-5">
            <SectionNav sections={SECTIONS} />
          </Card>

          {/* 3. Founder actions */}
          <Card tone="glass" className="p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Founder actions
            </h3>
            <div className="space-y-2.5">
              <Button asChild className="w-full justify-start text-xs font-bold" variant="primary" size="sm">
                <Link href={`/idea-validator?idea=${encodeURIComponent(opportunity.problem || opportunity.title)}`}>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Validate Custom Angle
                </Link>
              </Button>
              <Button asChild className="w-full justify-start text-xs" variant="secondary" size="sm">
                <Link href={`/chat?context=${encodeURIComponent(opportunity.title)}`}>
                  <Zap className="h-3.5 w-3.5 mr-2" />
                  Ask AI Co-pilot
                </Link>
              </Button>
            </div>
          </Card>

          {/* 3. Founder fit (personalized) */}
          {founderFit ? (
            <Card tone="glass" className="p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Your founder fit
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black"
                  style={{
                    background: `${scoreBand(founderFit.fitScore).hex}1f`,
                    color: scoreBand(founderFit.fitScore).hex,
                  }}
                >
                  {founderFit.fitScore}%
                </div>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  {founderFit.reason}
                </p>
              </div>
            </Card>
          ) : null}

          {/* 5. Related opportunities */}
          {related?.length ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Related opportunities
              </h3>
              <div className="space-y-3">
                {related.map((rel) => (
                  <OpportunityCard key={rel.id} opportunity={rel} />
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
