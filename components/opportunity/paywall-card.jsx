'use client';

import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/context/subscription-context';
import { cn } from '@/lib/utils';

/**
 * Client-side locked card shown to free users. It intentionally receives NO
 * sensitive children — the actual Pro content is withheld at the server level
 * by PaywallGate, so there is nothing here (or in the payload) to un-blur.
 */
export function PaywallCard({
  title = 'Founder Pro Intelligence',
  description = 'Detailed unit economics, regulatory moats, competitor vulnerability analysis and full market thesis are reserved for Pro members.',
  className,
}) {
  const { openPricingModal } = useSubscription();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/80 bg-surface-low/30',
        className
      )}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>

        <Badge variant="indigo" className="mb-2">
          <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
          Pro Member Intelligence
        </Badge>

        <h4 className="text-sm font-bold tracking-tight text-on-surface sm:text-base">{title}</h4>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-on-surface-variant">{description}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <Button size="sm" onClick={openPricingModal} className="shadow-md shadow-primary/20 font-bold">
            <Sparkles className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Unlock Pro Access
          </Button>
          <Button variant="secondary" size="sm" onClick={openPricingModal}>
            View Pricing Plans
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaywallCard;
