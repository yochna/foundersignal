'use client';

import * as React from 'react';
import { cn, clampScore } from '@/lib/utils';

/**
 * Horizontal meter used for score breakdowns. Deliberately not a Radix
 * component: it needs a caller-supplied colour per score band.
 */
function Meter({ value, max = 100, className, barClassName, color, label, showValue = true }) {
  const pct = Math.max(0, Math.min(100, (Number(value) || 0) / max * 100));
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            {label}
          </span>
          {showValue ? (
            <span className="mono text-[11px] font-bold text-on-surface">{clampScore(value)}</span>
          ) : null}
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high/60"
        role="progressbar"
        aria-valuenow={clampScore(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'score'}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', barClassName)}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Circular gauge used on opportunity cards and the detail score rail. */
function RadialGauge({ value, size = 56, stroke = 4, color, label, className }) {
  const score = clampScore(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-on-surface/10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center mono font-bold text-on-surface"
          style={{ fontSize: size * 0.29 }}
        >
          {score}
        </span>
      </div>
      {label ? (
        <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/80">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export { Meter, RadialGauge };
