'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Target,
  Swords,
  Rocket,
  Coins,
  AlertTriangle,
  ListChecks,
  RotateCcw,
  History,
  ArrowUpRight,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Meter, RadialGauge } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorPanel, InlineError } from '@/components/feedback/error-panel';
import { AiMeta } from '@/components/feedback/ai-meta';
import { QuotaMeter } from '@/components/feedback/quota-meter';
import { useSubscription } from '@/context/subscription-context';
import { api } from '@/lib/fetcher';
import { cn, formatRelativeTime, scoreBand, truncate } from '@/lib/utils';

const EXAMPLES = [
  'A compliance tool that scans NBFC collection calls in Hindi and flags RBI fair-practice violations with the exact clause cited.',
  'An underwriting API that scores MSME creditworthiness from GST filings and UPI settlement patterns instead of audited financials.',
  'A gateway that caps per-project LLM spend and blocks prompt injection before an agent can call an internal tool.',
];

const DIMENSIONS = [
  { key: 'demand', label: 'Demand', hint: 'How many people demonstrably have this problem now.' },
  { key: 'competition', label: 'Competition gap', hint: 'Higher means incumbents leave more room for you.' },
  { key: 'feasibility', label: 'Feasibility', hint: 'How buildable a first version is for a small team.' },
  { key: 'timing', label: 'Timing', hint: 'Whether the window is open now rather than later.' },
  { key: 'indiaRelevance', label: 'India relevance', hint: 'How India-specific the problem and buyer are.' },
  { key: 'regulation', label: 'Regulatory pressure', hint: 'How much regulation forces a purchase decision.' },
];

const MIN_LENGTH = 12;
const MAX_LENGTH = 2000;

function ResultSkeleton() {
  return (
    <div className="space-y-5">
      <Card tone="glass" className="p-5">
        <div className="flex items-start gap-5">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </Card>
      <Card tone="glass" className="p-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
      </Card>
    </div>
  );
}

function Panel({ title, icon: Icon, description, children, className }) {
  return (
    <Card tone="glass" className={cn('p-5', className)}>
      <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-on-surface">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-[10px] text-on-surface-variant/85">{description}</p>
      ) : null}
      <div className="mt-3.5">{children}</div>
    </Card>
  );
}

function BulletList({ items, tone = 'neutral', emptyMessage }) {
  if (!items || items.length === 0) {
    return <p className="text-xs italic text-on-surface-variant/70">{emptyMessage}</p>;
  }

  const dot = {
    neutral: 'bg-on-surface-variant/40',
    warning: 'bg-amber-signal',
    danger: 'bg-rose-signal',
    success: 'bg-emerald-signal',
  }[tone];

  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2.5">
          <span className={cn('mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />
          <span className="text-xs leading-relaxed text-on-surface-variant">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ValidatorClient({ initialQuota, history = [], isAuthed }) {
  const { isPro, openPricingModal } = useSubscription();
  const [idea, setIdea] = React.useState('');
  const [state, setState] = React.useState('idle');
  const [payload, setPayload] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [quota, setQuota] = React.useState(initialQuota);
  const [activeBlueprint, setActiveBlueprint] = React.useState(null);
  const [blueprintData, setBlueprintData] = React.useState(null);
  const [blueprintLoading, setBlueprintLoading] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [localHistory, setLocalHistory] = React.useState(history);
  const resultRef = React.useRef(null);

  const trimmed = idea.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH;
  const canSubmit = trimmed.length >= MIN_LENGTH && state !== 'loading';

  async function generateBlueprint(type) {
    if (!result) return;
    setActiveBlueprint(type);
    setBlueprintLoading(true);
    setBlueprintData(null);

    const res = await api.post('/api/idea-validator/followup', {
      idea: trimmed || payload?.idea,
      verdict: result.verdict,
      type,
    });

    setBlueprintLoading(false);
    if (!res.ok) {
      toast.error('Could not generate blueprint', { description: res.error?.message });
      return;
    }

    setBlueprintData(res.data?.data || res.data);
    toast.success('Blueprint ready!');
  }

  async function saveToNotebook() {
    if (!isAuthed) {
      toast.error('Sign in required to save to private notebook');
      return;
    }
    const res = await api.post('/api/idea-validator/saved', {
      idea: trimmed || payload?.idea,
      result,
    });

    if (res.ok) {
      setSavedSuccess(true);
      toast.success('Saved to your Private Notebook!');
      if (res.data?.record) {
        setLocalHistory((prev) => [res.data.record, ...prev]);
      }
    } else {
      toast.error('Failed to save', { description: res.error?.message });
    }
  }

  async function submit(event) {
    event?.preventDefault();
    if (!canSubmit) return;

    if (!isPro) {
      toast.error('Pro required', {
        description: 'Idea Validator is a Founder Pro feature. Unlock full scoring and evidence feeds.',
        action: { label: 'Upgrade', onClick: () => openPricingModal() },
      });
      return;
    }

    setState('loading');
    setError(null);
    setPayload(null);
    setBlueprintData(null);
    setActiveBlueprint(null);
    setSavedSuccess(false);

    const response = await api.post('/api/idea-validator', { idea: trimmed }, { timeoutMs: 60_000 });

    if (!response.ok) {
      setError(response.error);
      setState('error');
      toast.error('Validation failed', { description: response.error?.message });
      return;
    }

    setPayload(response.data);
    setState('done');
    if (response.data.meta?.quota) setQuota((q) => ({ ...q, ...response.data.meta.quota }));

    if (response.data.meta?.source === 'fallback') {
      toast.warning('Scored without live AI', {
        description: 'Deterministic scoring was used. See the note above the scorecard.',
      });
    }

    // Move focus to the result so screen readers announce it.
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  function reset() {
    setIdea('');
    setPayload(null);
    setError(null);
    setState('idle');
    setBlueprintData(null);
    setActiveBlueprint(null);
    setSavedSuccess(false);
  }

  const result = payload?.result;
  const band = result ? scoreBand(result.validationScore) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      {/* Input column */}
      <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <Card tone="glass" className="p-5">
          <form onSubmit={submit} noValidate>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Label htmlFor="idea-input">Your idea</Label>
              <QuotaMeter quota={quota} />
            </div>

            <Textarea
              id="idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Describe the problem, who has it, and what you would build. The more specific the buyer, the more useful the score."
              rows={7}
              maxLength={MAX_LENGTH}
              aria-describedby="idea-help"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e);
              }}
            />

            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p id="idea-help" className="text-[10px] text-on-surface-variant/80">
                Ctrl+Enter to submit
              </p>
              <span
                className={cn(
                  'mono text-[10px] font-bold',
                  trimmed.length > MAX_LENGTH - 100 ? 'text-amber-signal' : 'text-on-surface-variant/70'
                )}
              >
                {trimmed.length}/{MAX_LENGTH}
              </span>
            </div>

            {tooShort ? (
              <InlineError
                error={{ message: `Add at least ${MIN_LENGTH - trimmed.length} more characters.` }}
                className="mt-2"
              />
            ) : null}

            <div className="mt-4 flex gap-2">
              <Button type="submit" loading={state === 'loading'} disabled={!canSubmit} className="flex-1">
                {state !== 'loading' ? <Sparkles /> : null}
                {state === 'loading' ? 'Scoring' : 'Validate idea'}
              </Button>
              {payload || error ? (
                <Button type="button" variant="outline" size="icon" onClick={reset} aria-label="Clear">
                  <RotateCcw />
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card tone="glass" className="p-5">
          <CardEyebrow icon={Lightbulb}>Try an example</CardEyebrow>
          <ul className="mt-3 space-y-2">
            {EXAMPLES.map((example, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => setIdea(example)}
                  className="w-full rounded-lg border border-border bg-surface-low/60 p-2.5 text-left text-[11px] leading-relaxed text-on-surface-variant transition-colors hover:border-primary/40 hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {truncate(example, 120)}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {isAuthed && localHistory.length > 0 ? (
          <Card tone="glass" className="p-5">
            <CardEyebrow icon={History}>Your private idea notebook</CardEyebrow>
            <ul className="mt-3 space-y-2">
              {localHistory.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setIdea(row.ideaText)}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span
                      className={cn('mono shrink-0 text-xs font-bold', scoreBand(row.validationScore).text)}
                    >
                      {row.validationScore}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] leading-snug text-on-surface-variant">
                        {truncate(row.ideaText, 76)}
                      </span>
                      <span className="mt-0.5 block text-[9px] text-on-surface-variant/70">
                        {formatRelativeTime(row.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      {/* Result column */}
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="min-w-0 focus-visible:outline-none">
        {state === 'idle' ? (
          <Card tone="glass" className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="relative mb-5">
              <span
                className="absolute inset-0 -m-4 animate-pulse-ring rounded-full border border-primary/35"
                aria-hidden="true"
              />
              <Sparkles className="h-11 w-11 text-primary/50" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-on-surface">
              Your scorecard appears here
            </h2>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-on-surface-variant">
              You get a 0-100 verdict, six dimension scores, the unserved gaps, who you would be
              competing with, a concrete first build, a pricing hypothesis, the risks, and what to do
              this week.
            </p>
            <p className="mt-4 max-w-md text-[10px] leading-relaxed text-on-surface-variant/70">
              Every result is labelled with how it was produced: live model, cached response, or
              deterministic scoring. It is never presented as AI output when it is not.
            </p>
          </Card>
        ) : null}

        {state === 'loading' ? <ResultSkeleton /> : null}

        {state === 'error' ? (
          <ErrorPanel error={error} onRetry={submit} retryLabel="Try again" />
        ) : null}

        {state === 'done' && result ? (
          <div className="space-y-5">
            <Card tone="glass" className="overflow-hidden">
              <span
                className="block h-1 w-full"
                style={{ backgroundColor: band.hex }}
                aria-hidden="true"
              />
              <div className="p-5 sm:p-6">
                <AiMeta meta={payload.meta} className="mb-5" />

                <div className="flex flex-col items-start gap-5 sm:flex-row">
                  <RadialGauge
                    value={result.validationScore}
                    color={band.hex}
                    size={104}
                    stroke={7}
                    label="Validation"
                  />

                  <div className="min-w-0 flex-1">
                    <Badge variant={band.key === 'critical' ? 'emerald' : band.key === 'high' ? 'violet' : band.key === 'emerging' ? 'indigo' : 'amber'}>
                      {band.label}
                    </Badge>
                    <p className="mt-2.5 text-base font-bold leading-snug tracking-tight text-on-surface">
                      {result.verdict || 'Scored.'}
                    </p>
                    {result.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                        {result.summary}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-x-6 gap-y-4 border-t border-border/60 pt-5 sm:grid-cols-2">
                  {DIMENSIONS.map((dimension) => {
                    const value = result.scores?.[dimension.key] ?? 0;
                    return (
                      <div key={dimension.key} title={dimension.hint}>
                        <Meter label={dimension.label} value={value} color={scoreBand(value).hex} />
                      </div>
                    );
                  })}
                </div>

                {/* Follow-up Blueprint Action Bar & Save */}
                <div className="mt-6 border-t border-border/60 pt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-on-surface-variant mr-1">Deepen Blueprint:</span>
                    <Button
                      variant={activeBlueprint === 'roadmap' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => generateBlueprint('roadmap')}
                      loading={activeBlueprint === 'roadmap' && blueprintLoading}
                    >
                      🗺️ 4-Week MVP Roadmap
                    </Button>
                    <Button
                      variant={activeBlueprint === 'compliance' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => generateBlueprint('compliance')}
                      loading={activeBlueprint === 'compliance' && blueprintLoading}
                    >
                      📜 Regulatory Checklist
                    </Button>
                    <Button
                      variant={activeBlueprint === 'icp' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => generateBlueprint('icp')}
                      loading={activeBlueprint === 'icp' && blueprintLoading}
                    >
                      🎯 Target Enterprise ICPs
                    </Button>
                  </div>

                  {isAuthed ? (
                    <Button
                      variant={savedSuccess ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={saveToNotebook}
                      className={savedSuccess ? 'text-emerald-500 font-bold' : ''}
                    >
                      {savedSuccess ? '✓ Saved to Notebook' : '💾 Save to Notebook'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>

            {/* Generated Blueprint View */}
            {blueprintData ? (
              <Card tone="glass" className="border-primary/40 p-5 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-on-surface">
                      {blueprintData.title || 'Generated Blueprint'}
                    </h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setBlueprintData(null)}>
                    ✕ Close
                  </Button>
                </div>

                <div className="mt-4 text-xs leading-relaxed text-on-surface-variant">
                  {blueprintData.recommendedStack ? (
                    <div className="mb-4">
                      <p className="font-bold text-on-surface mb-1">Recommended Tech Stack:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {blueprintData.recommendedStack.map((tech, i) => (
                          <Badge key={i} variant="indigo">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {blueprintData.weeks ? (
                    <div className="space-y-3">
                      {blueprintData.weeks.map((w, i) => (
                        <div key={i} className="rounded-lg border border-border bg-surface-low/50 p-3">
                          <p className="font-bold text-on-surface">Week {w.week}: {w.focus}</p>
                          <ul className="mt-1.5 list-disc list-inside space-y-1 text-on-surface-variant">
                            {(w.deliverables || []).map((deliv, j) => (
                              <li key={j}>{deliv}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {blueprintData.checklist ? (
                    <div className="space-y-2.5">
                      {blueprintData.checklist.map((item, i) => (
                        <div key={i} className="rounded-lg border border-border bg-surface-low/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-on-surface">{item.category}: {item.requirement}</span>
                            <Badge variant="amber">{item.mandatoryBy}</Badge>
                          </div>
                          {item.penaltyRisk ? (
                            <p className="mt-1 text-[11px] text-rose-signal">Risk: {item.penaltyRisk}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {blueprintData.icps ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {blueprintData.icps.map((icp, i) => (
                        <div key={i} className="rounded-lg border border-border bg-surface-low/50 p-3.5">
                          <p className="font-bold text-on-surface">{icp.segment}</p>
                          <p className="mt-1 text-[11px]"><strong>Buyer:</strong> {icp.economicBuyer}</p>
                          <p className="mt-1 text-[11px]"><strong>Trigger:</strong> {icp.urgencyTrigger}</p>
                          <p className="mt-1 text-[11px]"><strong>WTP:</strong> {icp.willingnessToPay}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <Panel
                title="Unserved gaps"
                icon={Target}
                description="Where incumbents leave room."
              >
                <BulletList
                  items={result.gaps}
                  tone="success"
                  emptyMessage="No specific gap identified. That usually means the market is well served, or the idea needs sharpening."
                />
              </Panel>

              <Panel title="Who you would compete with" icon={Swords}>
                {result.competitors?.length ? (
                  <ul className="space-y-2.5">
                    {result.competitors.map((competitor, index) => (
                      <li key={index} className="rounded-lg border border-border bg-surface-low/50 p-3">
                        <p className="text-xs font-bold text-on-surface">{competitor.name}</p>
                        {competitor.note ? (
                          <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                            {competitor.note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-on-surface-variant/70">
                    No competitors mapped. Treat that as unfinished research, not an empty market.
                  </p>
                )}
              </Panel>

              <Panel title="Build this first" icon={Rocket}>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  {result.mvpBuild || 'Not specified.'}
                </p>
              </Panel>

              <Panel title="How it makes money" icon={Coins}>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  {result.monetization || 'Not specified.'}
                </p>
              </Panel>

              <Panel title="What would kill it" icon={AlertTriangle}>
                <BulletList
                  items={result.risks}
                  tone="danger"
                  emptyMessage="No risks captured. That is a gap in the analysis, not an absence of risk."
                />
              </Panel>

              <Panel title="Do this week" icon={ListChecks}>
                {result.nextSteps?.length ? (
                  <ol className="space-y-2.5">
                    {result.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="mono mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/15 text-[9px] font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-xs leading-relaxed text-on-surface-variant">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs italic text-on-surface-variant/70">No next steps suggested.</p>
                )}
              </Panel>
            </div>

            {payload.related?.length > 0 ? (
              <Panel
                title="Related briefs already in the radar"
                icon={Sparkles}
                description="Existing clusters that overlap with your idea. Read these before you build."
              >
                <ul className="space-y-2">
                  {payload.related.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/opportunities/${item.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border bg-surface-low/50 p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className={cn('mono shrink-0 text-sm font-bold', scoreBand(item.score).text)}>
                          {item.score}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-on-surface">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">{item.vertical}</span>
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            {!isAuthed ? (
              <Card tone="glass" className="flex flex-wrap items-center gap-3 border-primary/25 p-4">
                <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-surface-variant">
                  Sign in to keep a history of your validations and get the full daily AI allowance.
                </p>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/login?callbackUrl=/idea-validator">Sign in</Link>
                </Button>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ValidatorClient;
