'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Layers,
  Wrench,
  Wallet,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/fetcher';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 'role',
    title: 'Your founder role',
    description: 'What best describes where you are right now?',
    icon: User,
    type: 'single',
    options: [
      { value: 'aspiring', label: 'Aspiring founder', note: 'Exploring ideas, not yet building' },
      { value: 'early', label: 'Early-stage builder', note: 'Building an MVP or first product' },
      { value: 'growth', label: 'Growth-stage founder', note: 'Have customers, scaling product' },
      { value: 'operator', label: 'Operator / Executive', note: 'Evaluating a pivot or spin-out' },
      { value: 'investor', label: 'Angel / VC', note: 'Looking for deal flow & market signals' },
    ],
  },
  {
    id: 'city',
    title: 'Your base city',
    description: 'We use this to surface location-relevant regulatory and hiring signals.',
    icon: MapPin,
    type: 'single',
    options: [
      { value: 'bangalore', label: 'Bengaluru' },
      { value: 'mumbai', label: 'Mumbai' },
      { value: 'delhi', label: 'Delhi / NCR' },
      { value: 'hyderabad', label: 'Hyderabad' },
      { value: 'pune', label: 'Pune' },
      { value: 'chennai', label: 'Chennai' },
      { value: 'other', label: 'Other city' },
    ],
  },
  {
    id: 'verticals',
    title: 'Target verticals',
    description: 'Which sectors are you most interested in building for? Select up to 3.',
    icon: Layers,
    type: 'multi',
    max: 3,
    options: [
      { value: 'fintech', label: 'FinTech / BFSI', note: 'Payments, lending, insurance, wealth' },
      { value: 'b2b-saas', label: 'B2B SaaS', note: 'Enterprise & mid-market software' },
      { value: 'compliance', label: 'RegTech / Compliance', note: 'RBI, SEBI, DPDP, GST tooling' },
      { value: 'health', label: 'HealthTech', note: 'Clinical workflows, insurance, diagnostics' },
      { value: 'dev-tools', label: 'Developer Tools', note: 'APIs, SDKs, platform infrastructure' },
      { value: 'ai-ml', label: 'AI / ML Products', note: 'LLM applications, automation' },
      { value: 'logistics', label: 'Logistics & Supply Chain', note: 'Last-mile, warehousing, fleet' },
      { value: 'agritech', label: 'AgriTech', note: 'Kisan-facing, commodity, rural finance' },
    ],
  },
  {
    id: 'skills',
    title: 'Your core skills',
    description: 'What do you bring to the table? We use this to score your builder fit.',
    icon: Wrench,
    type: 'multi',
    max: 5,
    options: [
      { value: 'fullstack', label: 'Full-stack Engineering' },
      { value: 'ml-ai', label: 'ML / AI Engineering' },
      { value: 'product', label: 'Product Management' },
      { value: 'design', label: 'UI / UX Design' },
      { value: 'sales', label: 'B2B Sales' },
      { value: 'finance', label: 'Finance / CA / BFSI domain' },
      { value: 'compliance-domain', label: 'Regulatory & Compliance' },
      { value: 'growth', label: 'Growth / Marketing' },
      { value: 'ops', label: 'Operations / Supply Chain' },
    ],
  },
  {
    id: 'capital',
    title: 'Capital appetite',
    description: 'How are you planning to fund the venture?',
    icon: Wallet,
    type: 'single',
    options: [
      { value: 'bootstrapped', label: 'Bootstrapped', note: 'Self-funded, revenue-first from Day 1' },
      { value: 'angels', label: 'Angel / Friends & Family', note: '₹25L – ₹1Cr raise' },
      { value: 'pre-seed', label: 'Pre-seed VC', note: '₹1Cr – ₹5Cr raise' },
      { value: 'seed', label: 'Seed VC', note: '₹5Cr – ₹25Cr raise' },
      { value: 'series-a', label: 'Series A+', note: 'Already funded, looking to expand' },
    ],
  },
  {
    id: 'regulatory',
    title: 'Regulatory appetite',
    description: 'How comfortable are you building in heavily regulated spaces?',
    icon: ShieldCheck,
    type: 'single',
    options: [
      { value: 'avoid', label: 'Prefer unregulated', note: 'Move fast, avoid compliance overhead' },
      { value: 'light', label: 'Light regulation OK', note: 'Can handle GST / basic data compliance' },
      { value: 'moderate', label: 'Moderate regulation', note: 'Comfortable with SEBI / IRDAI' },
      { value: 'heavy', label: 'Full BFSI regulation', note: 'RBI licensing, PPI, payment aggregator' },
    ],
  },
];

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < current
              ? 'w-5 bg-primary'
              : i === current
                ? 'w-8 bg-primary'
                : 'w-3 bg-border'
          )}
        />
      ))}
    </div>
  );
}

function OptionChip({ option, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'border-primary bg-primary/8 text-on-surface shadow-sm'
          : 'border-border bg-surface-low/50 text-on-surface-variant hover:border-primary/40 hover:bg-surface-low',
        disabled && !selected && 'pointer-events-none opacity-40'
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{option.label}</span>
        {option.note ? (
          <span className="mt-0.5 block text-[11px] leading-relaxed text-on-surface-variant/80">
            {option.note}
          </span>
        ) : null}
      </span>
      {selected ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      ) : null}
    </button>
  );
}

export function OnboardingClient({ userId, userName, existingProfile }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [answers, setAnswers] = React.useState(() => {
    const base = {};
    STEPS.forEach((s) => {
      base[s.id] = s.type === 'multi' ? (existingProfile?.[s.id] ?? []) : (existingProfile?.[s.id] ?? '');
    });
    return base;
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = step; // 0-based index of step dot

  const currentAnswer = answers[current.id];
  const isAnswered =
    current.type === 'multi'
      ? Array.isArray(currentAnswer) && currentAnswer.length > 0
      : Boolean(currentAnswer);

  function toggleOption(value) {
    if (current.type === 'single') {
      setAnswers((prev) => ({ ...prev, [current.id]: value }));
    } else {
      setAnswers((prev) => {
        const arr = prev[current.id] || [];
        if (arr.includes(value)) return { ...prev, [current.id]: arr.filter((v) => v !== value) };
        if (arr.length >= (current.max || 99)) return prev;
        return { ...prev, [current.id]: [...arr, value] };
      });
    }
  }

  async function handleNext() {
    if (isLast) {
      await save();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function save() {
    setSaving(true);
    const response = await api.post('/api/onboarding', {
      ...answers,
      onboardingComplete: true,
    });
    setSaving(false);

    if (!response.ok) {
      toast.error('Could not save profile', { description: response.error?.message });
      return;
    }

    toast.success('Profile saved! Personalising your Radar…');
    router.push('/radar');
  }

  return (
    <div className="mx-auto max-w-xl py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Hey {userName}, let&apos;s personalise your Radar
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          6 quick questions — your answers shape which opportunities we surface first.
        </p>
        <div className="mt-5 flex justify-center">
          <StepIndicator current={progress} total={STEPS.length} />
        </div>
      </div>

      {/* Step card */}
      <Card tone="glass" className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12">
            <current.icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <Badge variant="indigo" className="mono text-[10px]">
            Step {step + 1} of {STEPS.length}
          </Badge>
        </div>
        <h2 className="mt-3 text-base font-bold tracking-tight text-on-surface">{current.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{current.description}</p>
        {current.type === 'multi' && current.max ? (
          <p className="mt-1 text-[10px] text-on-surface-variant/60">
            Select up to {current.max} (
            {(Array.isArray(currentAnswer) ? currentAnswer.length : 0)}/{current.max} chosen)
          </p>
        ) : null}

        <div className="mt-5 space-y-2.5">
          {current.options.map((option) => {
            const selected =
              current.type === 'multi'
                ? Array.isArray(currentAnswer) && currentAnswer.includes(option.value)
                : currentAnswer === option.value;

            const maxReached =
              current.type === 'multi' &&
              Array.isArray(currentAnswer) &&
              currentAnswer.length >= (current.max || 99) &&
              !selected;

            return (
              <OptionChip
                key={option.value}
                option={option}
                selected={selected}
                onClick={() => toggleOption(option.value)}
                disabled={maxReached}
              />
            );
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ChevronLeft />
          Back
        </Button>

        <Button
          size="sm"
          disabled={!isAnswered || saving}
          loading={saving}
          onClick={handleNext}
        >
          {isLast ? (
            <>
              <Sparkles />
              Finish &amp; Personalise
            </>
          ) : (
            <>
              Next
              <ChevronRight />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default OnboardingClient;
