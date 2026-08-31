'use client';

import * as React from 'react';
import {
  BadgeIndianRupee,
  Braces,
  Briefcase,
  Coins,
  FileText,
  Flame,
  Landmark,
  Layers,
  Lock,
  MessagesSquare,
  Rocket,
  ScrollText,
  Swords,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Meter, RadialGauge } from '@/components/ui/progress';
import { useSubscription } from '@/context/subscription-context';
import { scoreBand } from '@/lib/utils';

const COMPOSITE = 84;

const SCORES = [
  { label: 'Demand intensity', value: 88 },
  { label: 'Timing / why now', value: 91 },
  { label: 'Regulatory tailwind', value: 86 },
  { label: 'Hiring pull', value: 79 },
  { label: 'Competitive headroom', value: 62 },
  { label: 'India fit', value: 94 },
];

const EVIDENCE = [
  {
    icon: Briefcase,
    badge: 'Hiring',
    badgeVariant: 'indigo',
    headline: '“Senior Backend Engineer — Lending APIs” roles tripled in one quarter',
    detail:
      '27 live postings from neo-lending and fintech-infra startups name “credit line on UPI” in the job description. Salaries cluster at ₹28–45 LPA, Bengaluru-first.',
    meta: '10 sources · updated 2 days ago',
  },
  {
    icon: Landmark,
    badge: 'Regulatory',
    badgeVariant: 'emerald',
    headline: 'RBI opened the rails; the private sector is still building the on-ramp',
    detail:
      'The framework for credit lines on UPI removes the last licensing ambiguity. Two follow-on circulars this quarter tightened interoperability — a category-creating window.',
    meta: 'RBI circular · live RSS ingestion',
  },
  {
    icon: MessagesSquare,
    badge: 'Community',
    badgeVariant: 'violet',
    headline: 'Merchant forums complain about credit-line checkout friction',
    detail:
      'Recurring Reddit and community threads describe failed authorisations and drop-off at the UPI intent step. Unmet demand phrased in users’ own words.',
    meta: '41 threads · rising sentiment',
  },
  {
    icon: Braces,
    badge: 'Open source',
    badgeVariant: 'amber',
    headline: 'GitHub issue traffic on UPI intent SDKs up 3× QoQ',
    detail:
      'Contributors are patching credit-line edge cases in public SDKs — the builder community is already circling this exact problem.',
    meta: '312 tracked events',
  },
];

const WHY_NOW = [
  'Regulatory window: the framework is live but tooling lags by an estimated 2–3 quarters.',
  'Hiring pull: lenders are paying premiums for the exact skill stack a tooling startup needs.',
  'Distribution is pre-built: every UPI app becomes a potential channel, no cold start required.',
];

const MARKET = [
  { label: 'TAM (digital lending via UPI)', value: '₹1.8L Cr', note: 'by 2028 estimate' },
  { label: 'SAM (rail & tooling layer)', value: '₹42,000 Cr', note: 'addressable by independents' },
  { label: 'SOM (winnable in 36 months)', value: '₹8,600 Cr', note: 'realistic capture scenario' },
];

const COMPETITION = [
  { name: 'Incumbent PSP suites', stance: 'Bundled, slow to expose APIs', gap: 'Independent merchants are underserved' },
  { name: 'Lending-as-a-service majors', stance: 'Focused on NBFC balance sheets', gap: 'No checkout-layer product yet' },
  { name: 'Early startups (3 tracked)', stance: 'Pre-launch, demo-stage', gap: 'No evidence of production deployments' },
];

const LOCKED_ITEMS = [
  { icon: BadgeIndianRupee, title: 'Unit economics model', detail: 'CAC, LTV, payback period and margin scenarios, sized to Indian benchmarks.' },
  { icon: Layers, title: 'MVP architecture plan', detail: 'Stack, integrations and a 6-week build sequence with make-vs-buy calls.' },
  { icon: Users, title: 'Hiring map & salary benchmarks', detail: 'The 5 roles to hire first, with verified Indian salary bands per role.' },
  { icon: Rocket, title: '90-day go-to-market playbook', detail: 'Wedge segment, channel motion and the first 10 customers to chase.' },
];

export function SampleReport() {
  const { openPricingModal } = useSubscription();
  const band = scoreBand(COMPOSITE);

  return (
    <Card tone="glass" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">
            <FileText />
            Sample report
          </Badge>
          <Badge variant="outline">Mock data · no login needed</Badge>
        </div>
        <Button size="sm" onClick={openPricingModal}>
          <Lock />
          Unlock the full brief
        </Button>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_1.4fr] lg:p-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
            Opportunity brief
          </p>
          <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-on-surface">
            UPI-linked credit line rails
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            Tooling that lets lenders and merchants run credit lines over UPI intent flows.
          </p>
          <div className="mt-6 flex items-center gap-5">
            <RadialGauge value={COMPOSITE} color={band.hex} size={84} stroke={6} label="Composite" />
            <div>
              <Badge variant={scoreBand(COMPOSITE).key === 'high' ? 'violet' : 'emerald'}>{band.label}</Badge>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-signal">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                +18% momentum this month
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-border/70 bg-surface-low/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
              Executive summary
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
              The regulator switched the rails on before the tooling layer existed. Hiring, code and
              complaint data all point the same way: a 2–3 quarter window for an independent
              platform before incumbents bundle it away.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
            Score breakdown
          </p>
          <div className="space-y-3.5">
            {SCORES.map(({ label, value }) => (
              <Meter key={label} value={value} label={label} color={scoreBand(value).hex} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 p-6 lg:p-8">
        <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
          <Flame className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Evidence trail — every score is checkable
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {EVIDENCE.map(({ icon: Icon, badge, badgeVariant, headline, detail, meta }) => (
            <Card key={badge} tone="plain" className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <Badge variant={badgeVariant}>{badge}</Badge>
              </div>
              <h4 className="mt-3 text-[13px] font-bold leading-snug text-on-surface">{headline}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">{detail}</p>
              <p className="mono mt-3 text-[10px] font-semibold text-on-surface-variant/70">{meta}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-8 border-t border-border/60 p-6 lg:grid-cols-2 lg:p-8">
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
            Why now
          </p>
          <ul className="space-y-2.5">
            {WHY_NOW.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-xs leading-relaxed text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
          <p className="mb-3 mt-8 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
            Competitive snapshot
          </p>
          <div className="space-y-2">
            {COMPETITION.map(({ name, stance, gap }) => (
              <div key={name} className="rounded-lg border border-border/70 bg-surface-low/40 p-3">
                <p className="flex items-center justify-between gap-2 text-xs font-bold text-on-surface">
                  <span className="flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {name}
                  </span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                  {stance} · <span className="font-semibold text-on-surface">{gap}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
            Market sizing
          </p>
          <div className="space-y-2">
            {MARKET.map(({ label, value, note }) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-low/40 p-3.5">
                <div>
                  <p className="text-xs font-bold text-on-surface">{label}</p>
                  <p className="mt-0.5 text-[10px] text-on-surface-variant">{note}</p>
                </div>
                <span className="mono text-base font-black text-on-surface">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface">
              <Coins className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Numbers like these ship with sourcing notes in the full brief.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
              This sample shows the shape of a brief. The paid report adds the model behind every
              number and the playbook for acting on it.
            </p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/60 p-6 lg:p-8">
        <div aria-hidden="true" className="pointer-events-none select-none blur-[7px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {LOCKED_ITEMS.map(({ icon: Icon, title, detail }) => (
              <Card key={title} tone="plain" className="p-4">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="text-[13px] font-bold text-on-surface">{title}</p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">{detail}</p>
              </Card>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/40 px-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="max-w-md text-sm font-black text-on-surface">
            The deep-dive layer — unit economics, MVP plan, salary map, GTM playbook — unlocks with Pro
          </p>
          <p className="max-w-md text-xs text-on-surface-variant">
            Everything above is free to read. The sections that turn it into a decision are one plan away.
          </p>
          <Button onClick={openPricingModal} className="mt-1">
            <ScrollText />
            See what the full report includes
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default SampleReport;
