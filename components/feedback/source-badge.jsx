'use client';

import { Sparkles, Database, Cpu, CircleDot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InfoTip } from '@/components/ui/tooltip';

/**
 * Provenance badge for AI output.
 *
 * The product makes a hard promise: it never presents heuristic output as if a
 * model produced it. Every AI response carries `meta.source` and this badge
 * renders it, which is also the honest answer to "what is real vs simulated".
 */
const PRESETS = {
  live: {
    label: 'Live AI',
    variant: 'emerald',
    icon: Sparkles,
    tip: 'Generated just now by the configured Gemini model.',
  },
  cached: {
    label: 'Cached',
    variant: 'indigo',
    icon: Database,
    tip: 'An identical request was answered recently, so the stored model response was reused instead of spending quota.',
  },
  fallback: {
    label: 'Offline heuristic',
    variant: 'amber',
    icon: Cpu,
    tip: 'No model call was made. This is deterministic rule-based scoring, shown because the AI key is missing, the quota is spent, or the provider failed.',
  },
  seed: {
    label: 'Seed data',
    variant: 'default',
    icon: CircleDot,
    tip: 'Bundled starter content, not produced by a live ingestion run.',
  },
  ingested: {
    label: 'Ingested',
    variant: 'violet',
    icon: Sparkles,
    tip: 'Produced by an ingestion run from collected market signals.',
  },
};

export function SourceBadge({ source, className, showTip = true }) {
  const preset = PRESETS[source];
  if (!preset) return null;
  const Icon = preset.icon;

  const badge = (
    <Badge variant={preset.variant} className={className}>
      <Icon aria-hidden="true" />
      {preset.label}
    </Badge>
  );

  if (!showTip) return badge;

  return (
    <InfoTip label={preset.tip}>
      <button type="button" className="cursor-help focus-visible:outline-none">
        {badge}
      </button>
    </InfoTip>
  );
}

/** Banner shown above heuristic results so the downgrade is impossible to miss. */
export function FallbackNotice({ reason, className }) {
  if (!reason) return null;
  return (
    <div
      className={`glass flex items-start gap-2.5 rounded-lg border-amber-signal/30 p-3 text-[11px] leading-relaxed text-on-surface-variant ${className || ''}`}
    >
      <Cpu className="mt-px h-3.5 w-3.5 shrink-0 text-amber-signal" aria-hidden="true" />
      <span>
        <span className="font-bold text-on-surface">Heuristic mode. </span>
        {reason}
      </span>
    </div>
  );
}

export default SourceBadge;
