'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Radio, Layers, Users, Lock, Sparkles, Eye, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadialGauge } from '@/components/ui/progress';
import { Sparkline } from '@/components/opportunity/sparkline';
import { MomentumPill } from '@/components/opportunity/momentum-pill';
import { SaveButton } from '@/components/opportunity/save-button';
import { useSubscription } from '@/context/subscription-context';
import { cn, scoreBand, truncate, formatNumber } from '@/lib/utils';

/**
 * Radar feed card with Glassmorphic paywall gating for free users.
 * Free users see the title and score, while the writeup is frosted with glassmorphism.
 * Clicking prompts the user with the paid plan. Paid Pro users see everything crisp with zero blur.
 */
export function OpportunityCard({ opportunity, isSaved = false, className }) {
  const band = scoreBand(opportunity.score);
  const { isPro, openPricingModal } = useSubscription();

  const handleCardClick = (e) => {
    if (!isPro) {
      e.preventDefault();
      e.stopPropagation();
      openPricingModal();
    }
  };

  return (
    <Card
      tone="glass"
      className={cn(
        'group relative flex flex-col overflow-hidden cursor-pointer transition-all',
        'tile-hover',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Score band accent */}
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: band.hex }}
        aria-hidden="true"
      />

      <div className="flex items-start gap-4 p-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{opportunity.vertical}</Badge>
            <MomentumPill
              momentum={opportunity.momentum}
              changePercentage={opportunity.changePercentage}
            />
            {opportunity.founderFit ? (
              <Badge
                variant="emerald"
                className="mono font-bold text-[10px]"
                title={opportunity.founderFitReason || 'Personalized match based on your onboarding profile'}
              >
                {opportunity.founderFit}% Fit
              </Badge>
            ) : null}
            {!isPro ? (
              <Badge variant="indigo" className="text-[10px] font-bold">
                <Lock className="h-2.5 w-2.5 mr-1" /> Pro Brief
              </Badge>
            ) : null}
          </div>

          <h3 className="text-[15px] font-bold leading-snug tracking-tight text-on-surface">
            {isPro ? (
              <Link
                href={`/opportunities/${opportunity.id}`}
                className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {opportunity.title}
                <span className="absolute inset-0" aria-hidden="true" />
              </Link>
            ) : (
              <span className="group-hover:text-primary transition-colors">
                {opportunity.title}
              </span>
            )}
          </h3>

          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">
            {opportunity.industry}
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 flex-col items-center gap-2">
          <RadialGauge value={opportunity.score} color={band.hex} size={54} stroke={4} />
          <SaveButton
            opportunityId={opportunity.id}
            opportunityTitle={opportunity.title}
            initialSaved={isSaved}
          />
        </div>
      </div>

      {/* Opportunity writeup: Frosted with glassmorphism for free users, 100% crisp for Pro */}
      <div className="relative flex-1 px-5 py-1">
        {isPro ? (
          // Crisp view for Paid Pro users
          <div>
            <p className="text-xs leading-relaxed text-on-surface-variant">
              {truncate(opportunity.problem || opportunity.whyInteresting, 168)}
            </p>

            {opportunity.targetCustomer ? (
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-on-surface-variant/85">
                <Users className="mt-px h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-bold text-on-surface/80">Buyer: </span>
                  {truncate(opportunity.targetCustomer, 72)}
                </span>
              </p>
            ) : null}
          </div>
        ) : (
          // Glassmorphic blurred view with unlock callout for Free users
          <div className="relative overflow-hidden rounded-lg p-2.5 border border-primary/20 bg-surface-lowest/40 backdrop-blur-md">
            {/* Blurred background writeup */}
            <div className="select-none pointer-events-none filter blur-[3.5px] opacity-40 transition-all">
              <p className="text-xs leading-relaxed text-on-surface-variant">
                {truncate(opportunity.problem || opportunity.whyInteresting, 168)}
              </p>
              {opportunity.targetCustomer ? (
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  Buyer: {truncate(opportunity.targetCustomer, 60)}
                </p>
              ) : null}
            </div>

            {/* Glassmorphic unlock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-surface-lowest/30 backdrop-blur-[1.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-surface-container/90 px-3 py-1 text-[11px] font-bold text-primary shadow-md backdrop-blur-md group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all">
                <Lock className="h-3 w-3" />
                <span>Unlock Full Brief</span>
                <Sparkles className="h-3 w-3 ml-0.5" />
              </span>
            </div>
          </div>
        )}
      </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 px-5 py-3 text-[10px]">
        <span
          className="flex items-center gap-1 font-bold text-on-surface-variant"
          title={`${opportunity.signalCount} signals collected`}
        >
          <Radio className="h-3 w-3" aria-hidden="true" />
          <span className="mono">{opportunity.signalCount}</span> signals
        </span>
        <span
          className="flex items-center gap-1 font-bold text-on-surface-variant"
          title={`${opportunity.sourceCount} distinct sources`}
        >
          <Layers className="h-3 w-3" aria-hidden="true" />
          <span className="mono">{opportunity.sourceCount}</span> sources
        </span>

        {/* Urgency / social proof micro-badges */}
        {opportunity.viewers && opportunity.viewers > 0 ? (
          <span
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary"
            title={`${opportunity.viewers} builders viewing now`}
          >
            <Eye className="h-3 w-3" aria-hidden="true" />
            {formatNumber(opportunity.viewers)} viewing
          </span>
        ) : null}

        {opportunity.savesThisWeek && opportunity.savesThisWeek > 0 ? (
          <span
            className="flex items-center gap-1 rounded-full bg-emerald-signal/10 px-2 py-0.5 font-bold text-emerald-signal"
            title={`${opportunity.savesThisWeek} saves this week`}
          >
            <Bookmark className="h-3 w-3" aria-hidden="true" />
            {formatNumber(opportunity.savesThisWeek)} saved
          </span>
        ) : null}

        <Sparkline
          data={opportunity.signalsTimeline}
          color={band.hex}
          width={76}
          height={24}
          className="ml-auto shrink-0"
        />

        {!isPro ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-signal" aria-hidden="true" />
        ) : (
          <ArrowUpRight
            className="h-3.5 w-3.5 shrink-0 text-on-surface-variant transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        )}
      </div>
    </Card>
  );
}

export default OpportunityCard;
