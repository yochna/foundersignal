'use client';

import * as React from 'react';
import {
  ArrowRight,
  BadgeIndianRupee,
  BellRing,
  Layers,
  Check,
  Crown,
  FileText,
  Flame,
  Landmark,
  Rocket,
  Route,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/context/subscription-context';

const REPORT_CONTENTS = [
  {
    icon: FileText,
    title: 'Executive verdict & composite score',
    detail: 'The one-paragraph answer to “should I build this?” with a score you can defend.',
  },
  {
    icon: TrendingUp,
    title: 'Demand & timing deep-dive',
    detail: 'Signal velocity, momentum trend and the size of the window you actually have.',
  },
  {
    icon: Landmark,
    title: 'Regulatory moat map',
    detail: 'Every RBI and SEBI circular that shapes the category, mapped clause by clause.',
  },
  {
    icon: ScrollText,
    title: 'Evidence appendix',
    detail: 'All raw signals behind each score — hiring posts, threads, repos — so you verify, not trust.',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Unit economics model',
    detail: 'CAC, LTV and payback scenarios sized to Indian benchmarks, not Silicon Valley folklore.',
  },
  {
    icon: Users,
    title: 'Hiring map & salary benchmarks',
    detail: 'The first five roles to hire, with verified salary bands per role and city.',
  },
  {
    icon: Swords,
    title: 'Competitor teardown',
    detail: 'Who is moving, how they are positioned, and the gaps none of them is filling.',
  },
  {
    icon: Layers,
    title: 'MVP architecture plan',
    detail: 'Stack, integrations and a 6-week build sequence with make-vs-buy calls.',
  },
  {
    icon: Rocket,
    title: '90-day GTM playbook',
    detail: 'Wedge segment, channel motion and the first ten customers worth chasing.',
  },
  {
    icon: Route,
    title: '12-month phased roadmap',
    detail: 'What to do first, second and third, paced to the hours you actually have.',
  },
  {
    icon: BellRing,
    title: 'Real-time signal alerts',
    detail: 'Get pinged when a tracked theme breaks out — before it becomes obvious to everyone.',
  },
  {
    icon: Sparkles,
    title: 'AI validation, grounded & cited',
    detail: 'Stress-test your own ideas against the corpus, with every answer citing its sources.',
  },
];

export function PricingModal() {
  const { isPricingModalOpen, closePricingModal, startCheckout, isCheckingOut, paymentsLive } = useSubscription();

  return (
    <Dialog open={isPricingModalOpen} onOpenChange={(open) => !open && closePricingModal()}>
      <DialogContent className="glass-strong max-w-3xl max-h-[88vh] overflow-y-auto border-border/80 p-6 sm:p-8">
        <DialogHeader className="text-center sm:text-center items-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
            <Crown className="h-5 w-5" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Badge variant="amber" className="text-[10px] font-bold">
              <Flame className="h-2.5 w-2.5 mr-1" />
              Founding-member pricing
            </Badge>
            <Badge variant="indigo" className="text-[10px] font-bold">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              Founder Pro Access
            </Badge>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-on-surface">
            Pay once. Unlocked for good.
          </DialogTitle>

          <DialogDescription className="max-w-lg mx-auto text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            You saw what the free sample shows. A single ₹199 payment removes every locked section,
            permanently — no recurring charge, no subscription to remember to cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.16em] text-on-surface">
            Everything below is inside each detailed report
          </p>
          <p className="mt-1 text-center text-[11px] text-on-surface-variant">
            Comparable market-research engagements start around <span className="mono font-bold text-on-surface">₹75,000</span>.
            Here it's a one-time ₹199 — less than a single coffee run, unlocked forever.
          </p>
          {!paymentsLive ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Payments are launching soon. Unlocking below gives you free early access now — no charge, no card required.
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {REPORT_CONTENTS.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-surface-low/50 p-3"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                    <Check className="h-3 w-3 shrink-0 text-emerald-signal" aria-hidden="true" />
                    {title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <Card
            tone="glass"
            className="relative flex w-full max-w-sm flex-col justify-between p-5 pt-7 border-2 border-primary/70 bg-primary/5 shadow-lg shadow-primary/10"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
              <Badge variant="emerald" className="shadow-sm font-bold text-[9px] px-2.5 py-0.5">
                🔥 One-time payment • No renewal
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-on-surface">Full Report Access</h3>
                <Badge variant="indigo" className="text-[9px]">Lifetime</Badge>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-on-surface">₹199</span>
                <span className="text-xs text-on-surface-variant">one-time</span>
              </div>

              <p className="mt-1.5 text-[11px] text-on-surface-variant leading-normal">
                Pay once, unlocked forever. Everything in the report contents above, on every brief,
                for as long as you use FounderSignal.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <strong className="text-on-surface font-semibold">All 12 report sections unlocked, everywhere</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Full Opportunity Radar &amp; unlimited AI validations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Unit economics, MVP plans &amp; salary benchmarks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Real-time breakout signal alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>90-day GTM playbooks &amp; 12-month roadmaps</span>
                </li>
              </ul>
            </div>

            <Button
              variant="primary"
              className="mt-5 w-full font-bold text-xs shadow-md shadow-primary/20"
              onClick={() => startCheckout('venture_pro')}
              disabled={isCheckingOut}
            >
              <Zap className="h-3.5 w-3.5 mr-1 fill-current" />
              <span>
                {isCheckingOut
                  ? 'Opening checkout…'
                  : paymentsLive
                  ? 'Unlock full access (₹199)'
                  : 'Unlock free (early access)'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Card>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-on-surface-variant/75">
          <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>{paymentsLive ? 'Instant activation • Pay once, no renewals' : 'Instant activation • Free during early access'}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingModal;
