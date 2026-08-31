'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Upload,
  FileText,
  ClipboardPaste,
  X,
  RotateCcw,
  TrendingUp,
  ArrowUpRight,
  Route,
  Wrench,
  Info,
  Clock,
  FileSearch,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea, Label } from '@/components/ui/input';
import { RadialGauge, Meter } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ErrorPanel, InlineError } from '@/components/feedback/error-panel';
import { AiMeta } from '@/components/feedback/ai-meta';
import { QuotaMeter } from '@/components/feedback/quota-meter';
import { useSubscription } from '@/context/subscription-context';
import { api } from '@/lib/fetcher';
import { cn, formatRelativeTime, scoreBand } from '@/lib/utils';

const DIFFICULTY_VARIANT = { Low: 'emerald', Medium: 'indigo', High: 'rose' };

function DropZone({ file, onFile, onClear, maxBytes, disabled }) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef(null);
  const maxMb = Math.round(maxBytes / 1024 / 1024);

  function handleFiles(list) {
    const picked = list?.[0];
    if (picked) onFile(picked);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/8 p-3.5">
        <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-on-surface">{file.name}</p>
          <p className="mono text-[10px] text-on-surface-variant">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Remove file">
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        'rounded-lg border-2 border-dashed p-7 text-center transition-colors',
        dragging ? 'border-primary bg-primary/8' : 'border-border bg-surface-low/40'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
      <Upload className="mx-auto h-7 w-7 text-on-surface-variant/60" aria-hidden="true" />
      <p className="mt-3 text-xs font-bold text-on-surface">Drop a resume here</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">
        PDF or plain text, up to {maxMb} MB. Nothing is stored except the extracted structure.
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Choose a file
      </Button>
    </div>
  );
}

function ResultView({ result, matched, fileName, meta, quota, savedAt, onReset, isAuthed }) {
  const [simulatedSkills, setSimulatedSkills] = React.useState(new Set());

  const availableSimulations = React.useMemo(() => {
    const defaultList = [
      { name: 'LLM Security Guardrails', impact: 8, salary: '₹6L', why: 'Critical for enterprise GenAI deployments' },
      { name: 'RBI Lending & KFS Engines', impact: 12, salary: '₹10L', why: 'Mandatory compliance for all NBFCs & digital lenders' },
      { name: 'DPDP Data Privacy Architecture', impact: 9, salary: '₹8L', why: 'Statutory compliance across Indian consumer tech' },
      { name: 'GST E-Invoicing & Tally APIs', impact: 7, salary: '₹5L', why: 'Automation layer for MSME corporate accounts' },
      { name: 'Fraud Graph ML & Device Fingerprinting', impact: 11, salary: '₹9L', why: 'Payment aggregator chargeback protection' },
    ];

    const recList = (result.recommendations || []).map((r) => ({
      name: r.skill,
      impact: r.impactScore || 8,
      salary: '₹7L',
      why: r.why || 'Identified as high leverage for your profile',
    }));

    // Dedupe
    const seen = new Set();
    return [...recList, ...defaultList].filter((item) => {
      if (seen.has(item.name.toLowerCase())) return false;
      seen.add(item.name.toLowerCase());
      return true;
    });
  }, [result]);

  const simulatedDelta = React.useMemo(() => {
    let delta = 0;
    for (const sim of availableSimulations) {
      if (simulatedSkills.has(sim.name)) {
        delta += sim.impact;
      }
    }
    return delta;
  }, [simulatedSkills, availableSimulations]);

  const effectiveScore = Math.min(100, result.demandScore + simulatedDelta);
  const band = scoreBand(effectiveScore);

  function toggleSim(name) {
    setSimulatedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div aria-live="polite">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <QuotaMeter quota={quota} />
          {savedAt ? (
            <Badge variant="default">
              <Clock />
              Saved {formatRelativeTime(savedAt)}
            </Badge>
          ) : null}
        </div>
        <Button variant="secondary" size="sm" onClick={onReset}>
          <RotateCcw />
          Analyse another resume
        </Button>
      </div>

      {meta ? <AiMeta meta={meta} className="mb-6" /> : null}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card tone="strong" className="p-5 text-center">
            <RadialGauge
              value={effectiveScore}
              color={band.hex}
              size={128}
              stroke={8}
              label="Demand"
              className="mx-auto"
            />
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <p className="text-sm font-bold tracking-tight text-on-surface">{band.label}</p>
              {simulatedDelta > 0 ? (
                <Badge variant="emerald" className="mono text-[10px] font-bold">
                  +{simulatedDelta} Simulated
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
              {simulatedDelta > 0
                ? 'Simulated demand with your prospective skills active.'
                : 'How strongly the current market is pulling for your skill mix.'}
            </p>
          </Card>

          <Card tone="glass" className="p-5">
            <CardEyebrow icon={FileText}>Extracted profile</CardEyebrow>
            <dl className="mt-3 space-y-2.5 text-xs">
              {[
                ['Name', result.name],
                ['Current role', result.currentRole],
                ['Seniority', result.seniority],
                ['Source file', fileName],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {label}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-on-surface">{value}</dd>
                  </div>
                ))}
            </dl>

            {result.skills?.length ? (
              <div className="mt-4 border-t border-border/60 pt-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Detected skills
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-5">
          {result.summary ? (
            <Card tone="glass" className="p-5">
              <CardEyebrow icon={Info}>Read on your profile</CardEyebrow>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{result.summary}</p>
            </Card>
          ) : null}

          {result.recommendations?.length ? (
            <Card tone="glass" className="p-5">
              <CardEyebrow icon={Wrench}>Skills that would move your score most</CardEyebrow>
              <ul className="mt-4 space-y-3">
                {result.recommendations.map((rec) => (
                  <li key={rec.skill} className="rounded-lg border border-border bg-surface-low/50 p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-on-surface">{rec.skill}</span>
                      <Badge variant={DIFFICULTY_VARIANT[rec.difficulty] || 'default'}>
                        {rec.difficulty} effort
                      </Badge>
                      <span className="mono ml-auto text-[10px] font-bold text-emerald-signal">
                        +{rec.impactScore} demand
                      </span>
                    </div>
                    {rec.why ? (
                      <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">
                        {rec.why}
                      </p>
                    ) : null}
                    {rec.roleImpacted ? (
                      <p className="mt-1.5 text-[10px] font-semibold text-on-surface-variant/80">
                        Unlocks: {rec.roleImpacted}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <Meter value={(rec.impactScore / 30) * 100} color="#10b981" />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Interactive Skill Simulator */}
          <Card tone="glass" className="border-primary/35 p-5">
            <div className="flex items-center justify-between">
              <CardEyebrow icon={TrendingUp}>Interactive Skill Simulator</CardEyebrow>
              {simulatedSkills.size > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSimulatedSkills(new Set())}
                  className="text-xs"
                >
                  Reset simulator
                </Button>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Toggle prospective high-demand skills to simulate real-time market pull and salary upside:
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {availableSimulations.map((sim) => {
                const active = simulatedSkills.has(sim.name);
                return (
                  <button
                    key={sim.name}
                    type="button"
                    onClick={() => toggleSim(sim.name)}
                    className={cn(
                      'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      active
                        ? 'border-primary bg-primary/10 text-on-surface shadow-sm'
                        : 'border-border bg-surface-low/50 text-on-surface-variant hover:border-primary/40'
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-on-surface">{sim.name}</span>
                      <span className={cn('mono text-[10px] font-bold', active ? 'text-emerald-signal' : 'text-on-surface-variant')}>
                        +{sim.impact} pts
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant/80">
                      {sim.why}
                    </p>
                    <div className="mt-2 flex w-full items-center justify-between text-[9px] font-semibold text-primary">
                      <span>Upside: ~{sim.salary}</span>
                      <span>{active ? '✓ Active in simulator' : '+ Click to simulate'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {result.adjacentPaths?.length ? (
            <Card tone="glass" className="p-5">
              <CardEyebrow icon={Route}>Adjacent roles worth a jump</CardEyebrow>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {result.adjacentPaths.map((path) => (
                  <div
                    key={path.role}
                    className="rounded-lg border border-border bg-surface-low/50 p-3.5"
                  >
                    <p className="text-xs font-bold text-on-surface">{path.role}</p>
                    {path.salaryJump ? (
                      <p className="mono mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-signal">
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                        {path.salaryJump}
                      </p>
                    ) : null}
                    {path.bridgeSkill ? (
                      <p className="mt-2 text-[10px] leading-relaxed text-on-surface-variant">
                        Bridge skill: <span className="font-bold">{path.bridgeSkill}</span>
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <Meter
                        label="Demand index"
                        value={path.demandIndex}
                        color={scoreBand(path.demandIndex).hex}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {matched?.length ? (
            <Card tone="glass" className="p-5">
              <CardEyebrow icon={FileSearch}>Opportunities you could already build</CardEyebrow>
              <ul className="mt-3 divide-y divide-border/60">
                {matched.map((opportunity) => (
                  <li key={opportunity.id}>
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="mono text-[10px] font-black text-on-surface-variant">
                        {opportunity.score}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-on-surface">
                        {opportunity.title}
                      </span>
                      <Badge variant="outline">{opportunity.vertical}</Badge>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {!isAuthed ? (
            <Card tone="glass" className="flex flex-wrap items-center gap-3 border-primary/25 p-4">
              <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-surface-variant">
                Sign in to keep this profile so you can track your demand score over time.
              </p>
              <Button asChild size="sm" variant="secondary">
                <Link href="/login?callbackUrl=/career-signal">Sign in</Link>
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CareerClient({ initialQuota, previous, isAuthed, pdfReadable, maxBytes }) {
  const { isPro, openPricingModal } = useSubscription();
  const [mode, setMode] = React.useState(pdfReadable ? 'upload' : 'paste');
  const [file, setFile] = React.useState(null);
  const [text, setText] = React.useState('');
  const [state, setState] = React.useState(previous ? 'done' : 'idle');
  const [payload, setPayload] = React.useState(
    previous ? { result: previous.result, matched: [], fileName: previous.fileName, meta: null } : null
  );
  const [error, setError] = React.useState(null);
  const [quota, setQuota] = React.useState(initialQuota);

  function pickFile(picked) {
    if (picked.size > maxBytes) {
      setError({
        code: 'PAYLOAD_TOO_LARGE',
        message: `"${picked.name}" is ${(picked.size / 1024 / 1024).toFixed(1)} MB.`,
        hint: `The limit is ${Math.round(maxBytes / 1024 / 1024)} MB. Export a lighter PDF or paste the text instead.`,
      });
      return;
    }
    setError(null);
    setFile(picked);
  }

  async function submit() {
    if (!isPro) {
      toast.error('Pro required', {
        description: 'Career Signal resume analysis is a Founder Pro feature. Unlock demand scores and skill gap analysis.',
        action: { label: 'Upgrade', onClick: () => openPricingModal() },
      });
      return;
    }
    setError(null);
    setState('loading');

    let response;
    if (mode === 'upload' && file) {
      const form = new FormData();
      form.append('file', file);
      response = await api.postForm('/api/career-signal', form, { timeoutMs: 75_000 });
    } else {
      response = await api.post(
        '/api/career-signal',
        { resumeText: text, fileName: 'pasted-resume.txt' },
        { timeoutMs: 75_000 }
      );
    }

    if (!response.ok) {
      setError(response.error);
      setState('error');
      toast.error('Analysis failed', { description: response.error?.message });
      return;
    }

    setPayload(response.data);
    setState('done');
    if (response.data.meta?.quota) setQuota((q) => ({ ...q, ...response.data.meta.quota }));

    if (response.data.meta?.source === 'fallback') {
      toast.warning('Analysed without live AI', {
        description: 'Keyword-based extraction was used, so detail is coarser.',
      });
    } else {
      toast.success('Resume analysed');
    }
  }

  function reset() {
    setPayload(null);
    setError(null);
    setFile(null);
    setText('');
    setState('idle');
  }

  if (state === 'done' && payload) {
    return (
      <ResultView
        result={payload.result}
        matched={payload.matched}
        fileName={payload.fileName}
        meta={payload.meta}
        quota={quota}
        savedAt={previous && !payload.meta ? previous.createdAt : null}
        onReset={reset}
        isAuthed={isAuthed}
      />
    );
  }

  if (state === 'loading') {
    return (
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card tone="strong" className="p-5">
          <Skeleton className="mx-auto h-32 w-32 rounded-full" />
          <Skeleton className="mx-auto mt-3 h-4 w-24" />
        </Card>
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} tone="glass" className="space-y-3 p-5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const canSubmit = mode === 'upload' ? Boolean(file) : text.trim().length >= 40;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-end">
        <QuotaMeter quota={quota} />
      </div>

      {!pdfReadable ? (
        <Card tone="glass" className="mb-5 border-primary/25 p-4">
          <p className="text-[11px] leading-relaxed text-on-surface-variant">
            <span className="font-bold text-on-surface">No AI key is configured.</span> PDFs cannot be
            read without the model, so paste your resume text instead. You will still get a demand
            score and recommendations from the offline keyword analyser.
          </p>
        </Card>
      ) : null}

      <Card tone="glass" className="p-6">
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="mb-5">
            <TabsTrigger value="upload" disabled={!pdfReadable}>
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Upload a file
            </TabsTrigger>
            <TabsTrigger value="paste">
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              Paste text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <DropZone
              file={file}
              onFile={pickFile}
              onClear={() => setFile(null)}
              maxBytes={maxBytes}
              disabled={!pdfReadable}
            />
          </TabsContent>

          <TabsContent value="paste">
            <Label htmlFor="resume-text">Resume text</Label>
            <Textarea
              id="resume-text"
              rows={12}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                'Paste your resume here. Role titles, years of experience, tools and technologies matter most.\n\nExample:\nSenior Backend Engineer, 6 years. Node.js, PostgreSQL, AWS, Kafka. Built UPI reconciliation for a lending NBFC.'
              }
              className="mt-1.5 font-normal"
            />
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-on-surface-variant">
              <span>{text.trim().length < 40 ? 'At least 40 characters' : 'Ready to analyse'}</span>
              <span className="mono">{text.length} / 20000</span>
            </div>
          </TabsContent>
        </Tabs>

        {error ? <InlineError error={error} className="mt-4" /> : null}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
          <p className="text-[10px] leading-relaxed text-on-surface-variant/80">
            The file itself is never stored, only the extracted structure.
          </p>
          <Button size="sm" onClick={submit} disabled={!canSubmit}>
            <FileSearch />
            Analyse resume
          </Button>
        </div>
      </Card>

      {state === 'error' && error && error.code !== 'PAYLOAD_TOO_LARGE' ? (
        <ErrorPanel error={error} onRetry={submit} className="mt-5" />
      ) : null}
    </div>
  );
}

export default CareerClient;
