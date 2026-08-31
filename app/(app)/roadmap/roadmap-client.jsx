'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Route,
  Target,
  Flag,
  GraduationCap,
  Zap,
  AlertTriangle,
  RotateCcw,
  Clock,
  Compass,
  Lightbulb,
  Rocket,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { RadialGauge } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorPanel } from '@/components/feedback/error-panel';
import { AiThinking } from '@/components/feedback/ai-thinking';
import { AiMeta } from '@/components/feedback/ai-meta';
import { QuotaMeter } from '@/components/feedback/quota-meter';
import { api } from '@/lib/fetcher';
import { cn, formatRelativeTime, scoreBand } from '@/lib/utils';

const KINDS = [
  {
    value: 'idea',
    label: 'An idea',
    icon: Lightbulb,
    placeholder:
      'An underwriting API that scores MSME creditworthiness from GST filings and UPI settlement patterns instead of audited financials.',
    hint: 'Zero to first paying customer.',
  },
  {
    value: 'role',
    label: 'A role',
    icon: Compass,
    placeholder:
      'I want to move from backend engineering into an applied AI engineer role at a fintech, ideally within a year.',
    hint: 'Skill gaps, proof of work, then interviews.',
  },
  {
    value: 'startup',
    label: 'A startup',
    icon: Rocket,
    placeholder:
      'We run a GST reconciliation SaaS with 40 paying SMEs, growing 6% a month, but churn is 5% and onboarding takes three weeks.',
    hint: 'Find the constraint and move it.',
  },
];

const HORIZONS = ['30 days', '90 days', '6 months', '12 months'];
const EFFORT_VARIANT = { Low: 'emerald', Medium: 'indigo', High: 'rose' };

function PhaseCard({ phase, index, total }) {
  return (
    <li
      className="relative animate-slide-up-fade pl-10"
      style={{ animationDelay: `${Math.min(index, 6) * 80}ms` }}
    >
      {/* Spine connecting the phases, stopping short of the last marker. */}
      {index < total - 1 ? (
        <span
          className="absolute left-[15px] top-9 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-primary/45 to-border"
          aria-hidden="true"
        />
      ) : null}

      <span
        className="mono absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-primary/35 bg-surface-low text-[11px] font-black text-primary"
        aria-hidden="true"
      >
        {index + 1}
      </span>

      <Card tone="glass" className="tile-rise p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{phase.timeframe || `Phase ${index + 1}`}</Badge>
          <Badge variant={EFFORT_VARIANT[phase.effort] || 'default'}>{phase.effort} effort</Badge>
        </div>

        <h3 className="mt-2.5 text-sm font-bold leading-snug tracking-tight text-on-surface">
          {phase.name}
        </h3>
        {phase.objective ? (
          <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">{phase.objective}</p>
        ) : null}

        {phase.tasks?.length ? (
          <ul className="mt-3.5 space-y-1.5">
            {phase.tasks.map((task) => (
              <li key={task} className="flex gap-2 text-[11px] leading-relaxed text-on-surface-variant">
                <CheckCircle2
                  className="mt-0.5 h-3 w-3 shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
          {phase.deliverable ? (
            <div className="rounded-lg border border-border bg-surface-low/50 p-2.5">
              <dt className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                Deliverable
              </dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                {phase.deliverable}
              </dd>
            </div>
          ) : null}
          {phase.successMetric ? (
            <div className="rounded-lg border border-emerald-signal/25 bg-emerald-signal/[0.07] p-2.5">
              <dt className="text-[9px] font-bold uppercase tracking-wider text-emerald-signal">
                Done when
              </dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                {phase.successMetric}
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>
    </li>
  );
}

export function RoadmapClient({ initialQuota, history = [], isAuthed }) {
  const [kind, setKind] = React.useState('idea');
  const [goal, setGoal] = React.useState('');
  const [horizon, setHorizon] = React.useState('90 days');
  const [experience, setExperience] = React.useState('');
  const [hoursPerWeek, setHoursPerWeek] = React.useState(10);
  const [state, setState] = React.useState('idle');
  const [payload, setPayload] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [quota, setQuota] = React.useState(initialQuota);
  const resultRef = React.useRef(null);

  const activeKind = KINDS.find((k) => k.value === kind) || KINDS[0];
  const trimmed = goal.trim();
  const canSubmit = trimmed.length >= 12 && state !== 'loading';

  async function submit(event) {
    event?.preventDefault();
    if (!canSubmit) return;

    setState('loading');
    setError(null);
    setPayload(null);

    const response = await api.post(
      '/api/roadmap',
      { goal: trimmed, kind, horizon, experience: experience.trim(), hoursPerWeek },
      { timeoutMs: 60_000 }
    );

    if (!response.ok) {
      setError(response.error);
      setState('error');
      toast.error('Could not build the roadmap', { description: response.error?.message });
      return;
    }

    setPayload(response.data);
    setState('done');
    if (response.data.meta?.quota) setQuota((q) => ({ ...q, ...response.data.meta.quota }));

    if (response.data.meta?.source === 'fallback') {
      toast.warning('Planned without live AI', {
        description: 'A deterministic blueprint was used. See the note above the plan.',
      });
    }

    requestAnimationFrame(() => resultRef.current?.focus());
  }

  function reset() {
    setPayload(null);
    setError(null);
    setState('idle');
  }

  if (state === 'loading') {
    return (
      <AiThinking
        title="Sequencing your roadmap"
        icon={Route}
        stages={[
          'Reading the goal and your starting point',
          'Matching it against tracked opportunities and scarce skills',
          `Fitting the plan to ${hoursPerWeek} hours a week`,
          'Writing phases, milestones and the risks that stall them',
        ]}
        note="Phases are ordered so each one produces the evidence the next depends on."
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            tone="glass"
            className="animate-slide-up-fade p-4"
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2.5 h-4 w-1/2" />
            <Skeleton className="mt-2.5 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-5/6" />
          </Card>
        ))}
      </AiThinking>
    );
  }

  if (state === 'done' && payload) {
    const plan = payload.result;
    const band = scoreBand(plan.readinessScore);

    return (
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="focus-visible:outline-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <QuotaMeter quota={quota} />
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw />
            Plan something else
          </Button>
        </div>

        {payload.meta ? <AiMeta meta={payload.meta} className="mb-6" /> : null}

        <Card tone="glass" className="accent-top relative mb-6 overflow-hidden border-primary/25 p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <CardEyebrow icon={Route}>{horizon} plan</CardEyebrow>
              <h2 className="mt-2 text-lg font-bold leading-snug tracking-tight text-on-surface">
                {plan.title || trimmed.slice(0, 70)}
              </h2>
              {plan.summary ? (
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{plan.summary}</p>
              ) : null}
              {plan.northStar ? (
                <div className="mt-3.5 flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/[0.07] p-2.5">
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-[11px] leading-relaxed text-on-surface">
                    <span className="font-bold">North star: </span>
                    {plan.northStar}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <RadialGauge
                value={plan.readinessScore}
                color={band.hex}
                size={78}
                stroke={5}
                label="Ready"
              />
              <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                Readiness
              </span>
            </div>
          </div>
        </Card>

        {plan.quickWins?.length ? (
          <Card tone="glass" className="mb-6 p-4">
            <CardEyebrow icon={Zap}>Do these in the first 48 hours</CardEyebrow>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {plan.quickWins.map((win) => (
                <li
                  key={win}
                  className="rounded-lg border border-border bg-surface-low/50 p-2.5 text-[11px] leading-relaxed text-on-surface-variant"
                >
                  {win}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          The sequence
        </h3>
        <ol className="space-y-4">
          {(plan.phases || []).map((phase, index) => (
            <PhaseCard
              key={`${phase.name}-${index}`}
              phase={phase}
              index={index}
              total={plan.phases.length}
            />
          ))}
        </ol>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {plan.milestones?.length ? (
            <Card tone="glass" className="p-4">
              <CardEyebrow icon={Flag}>Milestones</CardEyebrow>
              <ul className="mt-3 space-y-2.5">
                {plan.milestones.map((milestone, index) => (
                  <li key={`${milestone.label}-${index}`} className="flex gap-2.5">
                    <Badge variant="outline" className="mt-0.5 shrink-0">
                      {milestone.when || `#${index + 1}`}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold leading-relaxed text-on-surface">
                        {milestone.label}
                      </p>
                      {milestone.proof ? (
                        <p className="mt-0.5 text-[10px] leading-relaxed text-on-surface-variant">
                          {milestone.proof}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {plan.skillsToLearn?.length ? (
            <Card tone="glass" className="p-4">
              <CardEyebrow icon={GraduationCap}>Skills to pick up</CardEyebrow>
              <ul className="mt-3 space-y-2.5">
                {plan.skillsToLearn.map((skill, index) => (
                  <li
                    key={`${skill.skill}-${index}`}
                    className="rounded-lg border border-border bg-surface-low/50 p-2.5"
                  >
                    <p className="text-[11px] font-bold text-on-surface">{skill.skill}</p>
                    {skill.why ? (
                      <p className="mt-0.5 text-[10px] leading-relaxed text-on-surface-variant">
                        {skill.why}
                      </p>
                    ) : null}
                    {skill.resource ? (
                      <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant/70">
                        {skill.resource}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        {plan.risks?.length ? (
          <Card tone="glass" className="mt-5 border-amber-signal/25 p-4">
            <CardEyebrow icon={AlertTriangle}>What stalls this plan</CardEyebrow>
            <ul className="mt-3 space-y-1.5">
              {plan.risks.map((risk) => (
                <li
                  key={risk}
                  className="flex gap-2 text-[11px] leading-relaxed text-on-surface-variant"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-signal" aria-hidden="true" />
                  {risk}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {payload.related?.length ? (
          <Card tone="glass" className="mt-5 p-4">
            <CardEyebrow icon={Compass}>Related briefs in the radar</CardEyebrow>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {payload.related.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={`/opportunities/${opportunity.id}`}
                  className="tile-hover rounded-lg border border-border bg-surface-low/50 p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex items-center justify-between gap-2">
                    <Badge variant="outline">{opportunity.vertical}</Badge>
                    <span className="mono text-[10px] font-bold text-on-surface-variant">
                      {opportunity.score}
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-start gap-1 text-[11px] font-semibold leading-snug text-on-surface">
                    {opportunity.title}
                    <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}

        {!isAuthed ? (
          <Card tone="glass" className="mt-6 flex flex-wrap items-center gap-3 border-primary/25 p-4">
            <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-surface-variant">
              Sign in to keep this roadmap, so you can reopen it instead of regenerating it.
            </p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/login?callbackUrl=/roadmap">Sign in</Link>
            </Button>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        {state === 'error' ? <ErrorPanel error={error} onRetry={submit} className="mb-5" /> : null}

        <form onSubmit={submit}>
          <Card tone="glass" className="accent-top relative overflow-hidden p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <CardEyebrow icon={Route}>What are you planning?</CardEyebrow>
              <QuotaMeter quota={quota} />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Plan type">
              {KINDS.map((option) => {
                const OptionIcon = option.icon;
                const selected = option.value === kind;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setKind(option.value)}
                    className={cn(
                      'tile-hover rounded-lg border p-3 text-left transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface-low/50 hover:border-primary/40'
                    )}
                  >
                    <OptionIcon
                      className={cn('h-4 w-4', selected ? 'text-primary' : 'text-on-surface-variant')}
                      aria-hidden="true"
                    />
                    <span className="mt-1.5 block text-xs font-bold text-on-surface">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-on-surface-variant">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Label htmlFor="roadmap-goal">Describe it</Label>
              <Textarea
                id="roadmap-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder={activeKind.placeholder}
                rows={5}
                maxLength={2000}
                className="mt-1.5"
              />
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="text-[10px] text-on-surface-variant/70">
                  The more specific the buyer, the sharper the plan.
                </p>
                <span
                  className={cn(
                    'mono text-[10px]',
                    trimmed.length >= 12 ? 'text-on-surface-variant/70' : 'text-amber-signal'
                  )}
                >
                  {trimmed.length}/2000
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="roadmap-horizon">Horizon</Label>
                <Select
                  id="roadmap-horizon"
                  value={horizon}
                  onChange={(event) => setHorizon(event.target.value)}
                  className="mt-1.5"
                >
                  {HORIZONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="roadmap-hours">Hours per week</Label>
                <Input
                  id="roadmap-hours"
                  type="number"
                  min={0}
                  max={120}
                  value={hoursPerWeek}
                  onChange={(event) => setHoursPerWeek(Number(event.target.value))}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="roadmap-experience">Your starting point</Label>
                <Input
                  id="roadmap-experience"
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                  placeholder="e.g. 6 years backend, no fintech contacts"
                  maxLength={300}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
              <Button type="submit" disabled={!canSubmit} loading={state === 'loading'}>
                <Route />
                Build the roadmap
              </Button>
              <p className="text-[10px] leading-relaxed text-on-surface-variant/70">
                Takes a few seconds. If the model is unreachable you still get a deterministic plan.
              </p>
            </div>
          </Card>
        </form>
      </div>

      <aside className="space-y-5">
        <Card tone="glass" className="dot-grid p-4">
          <CardEyebrow icon={Target}>How this differs from a to-do list</CardEyebrow>
          <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-on-surface-variant">
            <li>Every phase ends in an artefact you can show someone.</li>
            <li>Each phase has a stop condition, so you know when to move on.</li>
            <li>The plan is scaled to the hours you said you have, not an ideal week.</li>
          </ul>
        </Card>

        {history.length ? (
          <Card tone="glass" className="p-4">
            <CardEyebrow icon={Clock}>Your recent plans</CardEyebrow>
            <ul className="mt-3 space-y-2.5">
              {history.map((entry) => (
                <li key={entry.id} className="border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                  <p className="text-[11px] font-semibold leading-snug text-on-surface">
                    {entry.title || entry.inputText.slice(0, 60)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                    <Badge variant="outline">{entry.horizon}</Badge>
                    {formatRelativeTime(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {!isAuthed ? (
          <Card tone="glass" className="border-primary/25 p-4">
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              Sign in to keep every roadmap you generate and get a larger daily allowance.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <Link href="/login?callbackUrl=/roadmap">Sign in</Link>
            </Button>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

export default RoadmapClient;
