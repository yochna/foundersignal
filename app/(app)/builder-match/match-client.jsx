'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Trophy,
  Footprints,
  AlertTriangle,
  Clock,
  Gauge,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadialGauge, Meter } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { AiThinking } from '@/components/feedback/ai-thinking';
import { AiMeta } from '@/components/feedback/ai-meta';
import { QuotaMeter } from '@/components/feedback/quota-meter';
import { useSubscription } from '@/context/subscription-context';
import { MomentumPill } from '@/components/opportunity/momentum-pill';
import { api } from '@/lib/fetcher';
import { cn, formatRelativeTime, scoreBand } from '@/lib/utils';

const COMPLEXITY_VARIANT = { Low: 'emerald', Medium: 'indigo', High: 'rose' };

function MatchCard({ match, rank }) {
  const opportunity = match.opportunity;
  const band = scoreBand(match.fitScore);

  return (
    <Card
      tone="glass"
      className="tile-rise animate-slide-up-fade overflow-hidden"
      // Staggered entrance so the ranking reads top-down as it appears.
      style={{ animationDelay: `${Math.min(rank - 1, 6) * 70}ms` }}
    >
      <div className="flex items-start gap-4 p-5">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <span
            className={cn(
              'mono flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black',
              rank === 1 ? 'bg-primary text-on-primary' : 'bg-surface-high text-on-surface-variant'
            )}
          >
            {rank}
          </span>
          <RadialGauge value={match.fitScore} color={band.hex} size={58} stroke={4} label="Fit" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{opportunity.vertical}</Badge>
            <MomentumPill
              momentum={opportunity.momentum}
              changePercentage={opportunity.changePercentage}
            />
            <Badge variant={COMPLEXITY_VARIANT[match.complexity] || 'default'}>
              {match.complexity} complexity
            </Badge>
          </div>

          <h3 className="text-sm font-bold leading-snug tracking-tight text-on-surface">
            <Link
              href={`/opportunities/${opportunity.id}`}
              className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {opportunity.title}
            </Link>
          </h3>

          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{match.rationale}</p>

          <dl className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-low/50 p-2.5">
              <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                <Footprints className="h-2.5 w-2.5" aria-hidden="true" />
                Your first step
              </dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                {match.firstStep}
              </dd>
            </div>
            <div className="rounded-lg border border-amber-signal/25 bg-amber-signal/8 p-2.5">
              <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-signal">
                <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                Watch out
              </dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                {match.watchOut}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5">
        <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant">
          <Clock className="h-3 w-3" aria-hidden="true" />
          MVP {match.mvpEffort}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant">
          <Gauge className="h-3 w-3" aria-hidden="true" />
          Signal score <span className="mono">{opportunity.score}</span>
        </span>
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="ml-auto flex items-center gap-1 text-[10px] font-bold text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Full brief
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

export function MatchClient({ questions, initialQuota, previous, isAuthed }) {
  const { isPro, openPricingModal } = useSubscription();
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState(previous?.answers || {});
  const [state, setState] = React.useState(previous ? 'done' : 'idle');
  const [payload, setPayload] = React.useState(
    previous ? { profileSummary: previous.profileSummary, matches: previous.matches, meta: null } : null
  );
  const [error, setError] = React.useState(null);
  const [quota, setQuota] = React.useState(initialQuota);
  const resultRef = React.useRef(null);

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  function choose(value) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);

    if (!isLast) {
      // Brief pause so the selection is visible before advancing.
      setTimeout(() => setStep((s) => Math.min(s + 1, questions.length - 1)), 180);
    } else {
      setTimeout(() => submit(next), 200);
    }
  }

  async function submit(finalAnswers = answers) {
    if (!isPro) {
      toast.error('Pro required', {
        description: 'Builder Match ranking is a Founder Pro feature. Unlock personalized opportunity fit.',
        action: { label: 'Upgrade', onClick: () => openPricingModal() },
      });
      return;
    }
    setState('loading');
    setError(null);

    const response = await api.post('/api/builder-match', { answers: finalAnswers }, { timeoutMs: 60_000 });

    if (!response.ok) {
      setError(response.error);
      setState('error');
      toast.error('Matching failed', { description: response.error?.message });
      return;
    }

    setPayload(response.data);
    setState('done');
    if (response.data.meta?.quota) setQuota((q) => ({ ...q, ...response.data.meta.quota }));

    if (response.data.meta?.source === 'fallback') {
      toast.warning('Ranked without live AI', {
        description: 'Deterministic rule-based matching was used.',
      });
    }

    requestAnimationFrame(() => resultRef.current?.focus());
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setPayload(null);
    setError(null);
    setState('idle');
  }

  if (state === 'done' && payload) {
    const matches = payload.matches || [];
    const top = matches[0];

    return (
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="focus-visible:outline-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <QuotaMeter quota={quota} />
            {previous && !payload.meta ? (
              <Badge variant="default">
                <Clock />
                Saved {formatRelativeTime(previous.createdAt)}
              </Badge>
            ) : null}
          </div>
          <Button variant="secondary" size="sm" onClick={restart}>
            <RotateCcw />
            Retake the diagnostic
          </Button>
        </div>

        {payload.meta ? <AiMeta meta={payload.meta} className="mb-6" /> : null}

        {matches.length === 0 ? (
          <ErrorPanel
            error={{
              code: 'INTERNAL',
              message: 'No matches could be produced.',
              hint: 'This happens when the opportunity feed is empty. Run an ingestion pass, then retake the diagnostic.',
            }}
            onRetry={restart}
            retryLabel="Retake"
          />
        ) : (
          <>
            {top ? (
              <Card tone="glass" className="mb-6 border-primary/25 p-5">
                <CardEyebrow icon={Trophy}>Your strongest fit</CardEyebrow>
                <p className="mt-2 text-lg font-bold leading-snug tracking-tight text-on-surface">
                  {top.opportunity.title}
                </p>
                {payload.profileSummary ? (
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                    {payload.profileSummary}
                  </p>
                ) : null}
                <div className="mt-4 max-w-sm">
                  <Meter
                    label="Fit score"
                    value={top.fitScore}
                    color={scoreBand(top.fitScore).hex}
                  />
                </div>
              </Card>
            ) : null}

            <div className="space-y-5">
              {matches.map((match, index) => (
                <MatchCard key={match.opportunityId} match={match} rank={index + 1} />
              ))}
            </div>
          </>
        )}

        {!isAuthed ? (
          <Card tone="glass" className="mt-6 flex flex-wrap items-center gap-3 border-primary/25 p-4">
            <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-surface-variant">
              Sign in to save this ranking so it is waiting for you next time.
            </p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/login?callbackUrl=/builder-match">Sign in</Link>
            </Button>
          </Card>
        ) : null}
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <AiThinking
        title="Ranking every opportunity against your answers"
        icon={UserCheck}
        stages={[
          'Reading your five answers into a founder profile',
          'Loading the opportunity feed and its signals',
          'Scoring domain fit, capital and regulatory exposure',
          'Ordering the ranking and writing each rationale',
        ]}
        note="Every opportunity is scored, not filtered, so you also see what to avoid and why."
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            tone="glass"
            className="animate-slide-up-fade p-5"
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          </Card>
        ))}
      </AiThinking>
    );
  }

  if (state === 'error') {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorPanel error={error} onRetry={() => submit()} />
        <div className="mt-3 text-center">
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw />
            Start over
          </Button>
        </div>
      </div>
    );
  }

  // Quiz
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Question {step + 1} of {questions.length}
          </span>
          <QuotaMeter quota={quota} />
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-surface-high/60"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Diagnostic progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card tone="glass" className="animate-fade-up p-6 sm:p-7" key={question.id}>
        <h2 className="text-lg font-bold leading-snug tracking-tight text-on-surface">
          {question.questionText}
        </h2>
        {question.helper ? (
          <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">{question.helper}</p>
        ) : null}

        <div className="mt-6 space-y-2.5" role="radiogroup" aria-label={question.questionText}>
          {question.options.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                key={option.text}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(option.value)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface-low/50 hover:border-primary/40 hover:bg-surface-low'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selected ? 'border-primary bg-primary' : 'border-border'
                  )}
                  aria-hidden="true"
                >
                  {selected ? <Check className="h-2.5 w-2.5 text-on-primary" strokeWidth={4} /> : null}
                </span>
                <span className="text-xs font-semibold text-on-surface">{option.text}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft />
            Back
          </Button>

          {isLast ? (
            <Button size="sm" onClick={() => submit()} disabled={!answers[question.id]}>
              <UserCheck />
              Rank opportunities
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep((s) => Math.min(s + 1, questions.length - 1))}
              disabled={!answers[question.id]}
            >
              Next
              <ArrowRight />
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-on-surface-variant/70">
        Five questions, roughly a minute. Your answers rank every opportunity in the feed rather than
        filtering it, so you also see what to avoid and why.
      </p>
    </div>
  );
}

export default MatchClient;
