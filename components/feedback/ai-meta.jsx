'use client';

import { Clock, Coins, Gauge, Wrench } from 'lucide-react';
import { SourceBadge, FallbackNotice } from '@/components/feedback/source-badge';
import { formatUsd } from '@/lib/utils';

/**
 * Provenance header rendered above every AI result: where the answer came from,
 * why if it was downgraded, and what it cost.
 */
export function AiMeta({ meta, className, compact = false }) {
  if (!meta) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <SourceBadge source={meta.source} />

        {typeof meta.latencyMs === 'number' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span className="mono">{(meta.latencyMs / 1000).toFixed(1)}s</span>
          </span>
        ) : null}

        {meta.source === 'live' && typeof meta.tokens === 'number' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant">
            <Gauge className="h-3 w-3" aria-hidden="true" />
            <span className="mono">{meta.tokens}</span> tokens
          </span>
        ) : null}

        {meta.source === 'live' && typeof meta.costEstimate === 'number' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant">
            <Coins className="h-3 w-3" aria-hidden="true" />
            <span className="mono">{formatUsd(meta.costEstimate)}</span>
          </span>
        ) : null}

        {meta.jsonRepair ? (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant"
            title={`The model's JSON needed repair (${meta.jsonRepair}) before it could be used.`}
          >
            <Wrench className="h-3 w-3" aria-hidden="true" />
            repaired
          </span>
        ) : null}

        {meta.quota && meta.source === 'live' ? (
          <span className="text-[10px] font-semibold text-on-surface-variant">
            {meta.quota.unlimited ? (
              <>Unlimited runs · Pro</>
            ) : (
              <>
                <span className="mono">{meta.quota.remaining}</span> runs left today
              </>
            )}
          </span>
        ) : null}
      </div>

      {/* In a chat transcript the full notice repeats on every turn, so the
          badge alone carries the provenance. */}
      {meta.degradedReason && !compact ? (
        <FallbackNotice reason={meta.degradedReason} className="mt-3" />
      ) : null}
    </div>
  );
}

export default AiMeta;
