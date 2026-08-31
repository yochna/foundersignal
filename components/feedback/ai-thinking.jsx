'use client';

import * as React from 'react';
import { Brain, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The waiting state for any AI-backed feature.
 *
 * A model call here takes four to fifteen seconds, which is long enough that a
 * bare spinner reads as a hang. This shows what the request is actually doing,
 * ticks the stages forward on a timer, and counts the seconds, so a slow call
 * still looks alive. The stage timings are presentational: the API does not
 * stream progress, so the sequence is paced rather than reported.
 *
 * Motion is suppressed wholesale by the prefers-reduced-motion rule in
 * globals.css, so nothing here needs to branch on it.
 */

const DEFAULT_STAGES = [
  'Reading your input',
  'Pulling matching signals from the radar',
  'Weighing the evidence',
  'Drafting the answer',
];

/** How long each stage holds before advancing, in milliseconds. */
const STAGE_MS = 2600;

export function AiThinking({
  title = 'Working on it',
  stages = DEFAULT_STAGES,
  icon: Icon = Brain,
  note,
  className,
  children,
}) {
  const [stage, setStage] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    // The last stage holds until the response lands rather than looping, so the
    // list never implies more work than there is.
    const advance = setInterval(
      () => setStage((current) => Math.min(current + 1, stages.length - 1)),
      STAGE_MS
    );
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(advance);
      clearInterval(tick);
    };
  }, [stages.length]);

  const slow = elapsed >= 12;

  return (
    <div className={cn('space-y-5', className)} role="status" aria-live="polite">
      <div className="glass accent-top relative overflow-hidden rounded-xl">
        <div className="aurora-surface absolute inset-0" aria-hidden="true" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border border-primary/40 animate-ring-expand"
              aria-hidden="true"
            />
            <span
              className="absolute inset-1.5 rounded-full border border-dashed border-primary/35 animate-orbit-slow"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring"
              aria-hidden="true"
            />
            <Icon className="relative h-6 w-6 animate-float text-primary" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <p className="text-sm font-bold tracking-tight text-on-surface">{title}</p>
              <span className="mono text-[10px] font-bold text-on-surface-variant/70">
                {elapsed}s
              </span>
            </div>

            <ol className="mt-3 space-y-1.5">
              {stages.map((label, index) => {
                const done = index < stage;
                const active = index === stage;
                return (
                  <li
                    key={label}
                    className={cn(
                      'flex items-center gap-2 text-[11px] leading-relaxed transition-colors duration-500',
                      done && 'text-on-surface-variant/60',
                      active && 'font-semibold text-on-surface',
                      !done && !active && 'text-on-surface-variant/35'
                    )}
                  >
                    <span
                      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
                      aria-hidden="true"
                    >
                      {done ? (
                        <Check className="h-3 w-3 text-emerald-signal" strokeWidth={3} />
                      ) : active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce-dot" />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ol>

            <div
              className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-high/60"
              aria-hidden="true"
            >
              <div className="h-full w-1/3 rounded-full bg-primary/80 animate-sweep" />
            </div>

            <p className="mt-2.5 text-[10px] leading-relaxed text-on-surface-variant/70">
              {slow
                ? 'Taking longer than usual. The free model tier throttles under load; if it cannot answer, you still get a deterministic result rather than an error.'
                : note || 'Grounded in the opportunity database, so the answer cites real briefs.'}
            </p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

export default AiThinking;
