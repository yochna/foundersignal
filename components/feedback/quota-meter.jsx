'use client';

import { Cpu, Sparkles, Clock } from 'lucide-react';
import { InfoTip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Shows the remaining free daily allowance before the user spends a run, so a
 * quota downgrade is never a surprise.
 */
export function QuotaMeter({ quota, className }) {
  if (!quota) return null;

  if (!quota.aiConfigured) {
    return (
      <InfoTip label="No GEMINI_API_KEY is configured, so this feature uses deterministic rule-based scoring. Results are labelled accordingly.">
        <span
          className={cn(
            'inline-flex cursor-help items-center gap-1.5 rounded-full border border-amber-signal/30 bg-amber-signal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-signal',
            className
          )}
        >
          <Cpu className="h-3 w-3" aria-hidden="true" />
          Heuristic mode
        </span>
      </InfoTip>
    );
  }

  if (quota.unlimited) {
    return (
      <InfoTip label="Pro plan: unlimited live AI runs today. The shared global AI budget still applies as a cost guard.">
        <span
          className={cn(
            'inline-flex cursor-help items-center gap-1.5 rounded-full border border-emerald-signal/25 bg-emerald-signal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-signal',
            className
          )}
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Unlimited AI · Pro
        </span>
      </InfoTip>
    );
  }

  const exhausted = quota.remaining <= 0;
  const low = !exhausted && quota.remaining <= 1;

  return (
    <InfoTip
      label={
        exhausted
          ? `Allowance spent. Requests now use deterministic scoring until ${new Date(quota.resetAt).toLocaleString('en-IN')}.`
          : `${quota.remaining} of ${quota.limit} live AI runs left today${quota.isAnonymous ? '. Sign in for the full allowance.' : '.'} Resets at 00:00 UTC.`
      }
    >
      <span
        className={cn(
          'inline-flex cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
          exhausted
            ? 'border-amber-signal/30 bg-amber-signal/10 text-amber-signal'
            : low
              ? 'border-amber-signal/25 bg-amber-signal/8 text-amber-signal'
              : 'border-emerald-signal/25 bg-emerald-signal/10 text-emerald-signal',
          className
        )}
      >
        {exhausted ? (
          <Clock className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Sparkles className="h-3 w-3" aria-hidden="true" />
        )}
        {exhausted ? 'Daily limit reached' : `${quota.remaining}/${quota.limit} AI runs left`}
      </span>
    </InfoTip>
  );
}

export default QuotaMeter;
