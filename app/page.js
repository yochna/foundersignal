import Link from 'next/link';
import {
  ArrowRight,
  BadgeIndianRupee,
  Braces,
  Briefcase,
  Building2,
  Compass,
  Crown,
  FileSearch,
  FileText,
  Landmark,
  Lightbulb,
  MessagesSquare,
  Puzzle,
  Radar as RadarIcon,
  Rocket,
  Route,
  Rss,
  ScrollText,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BrandLockup } from '@/components/shell/brand';
import { ThemeSwitcher } from '@/components/shell/theme-switcher';
import { RadarBackground } from '@/components/landing/radar-background';

export const metadata = {
  title: 'FounderSignal — Know what India wants built next',
  description:
    'FounderSignal watches hiring posts, RBI and SEBI circulars, community threads and open-source activity, then turns them into scored, evidence-backed startup opportunity briefs.',
};

const FEATURES = [
  {
    href: '/radar',
    icon: RadarIcon,
    badge: 'Live feed',
    badgeVariant: 'primary',
    title: 'Opportunity Radar',
    description:
      'Scored themes moving right now — ranked, trended, and refreshed as fresh signals land.',
  },
  {
    href: '/idea-validator',
    icon: Lightbulb,
    badge: 'AI',
    badgeVariant: 'violet',
    title: 'Idea Validator',
    description:
      'Paste your idea and get a grounded verdict: demand, timing, competition and what would change the score.',
  },
  {
    href: '/builder-match',
    icon: Puzzle,
    badge: '8 questions',
    badgeVariant: 'indigo',
    title: 'Builder Match',
    description:
      'A short quiz that scores every live opportunity against your skills, capital and appetite.',
  },
  {
    href: '/career-signal',
    icon: FileSearch,
    badge: 'Resume aware',
    badgeVariant: 'emerald',
    title: 'Career Signal',
    description:
      'Upload your resume and see which in-demand skills matter next, tied to real hiring signals.',
  },
  {
    href: '/roadmap',
    icon: Route,
    badge: 'Phased',
    badgeVariant: 'amber',
    title: 'Suggested Roadmap',
    description:
      'First, second, third — a paced plan for a role, an idea or a startup, sized to your hours.',
  },
  {
    href: '/chat',
    icon: MessagesSquare,
    badge: 'Cited',
    badgeVariant: 'rose',
    title: 'AI Copilot',
    description:
      'Ask anything about the corpus. Every answer cites the briefs it used, so a claim can be checked.',
  },
];

const STEPS = [
  {
    icon: Rss,
    title: 'Collect',
    description:
      'GitHub activity, RBI and SEBI circulars, Reddit threads and hiring posts are pulled continuously.',
  },
  {
    icon: Braces,
    title: 'Cluster',
    description:
      'Signals are grouped into themes, so scattered noise becomes a readable market picture.',
  },
  {
    icon: Target,
    title: 'Score',
    description:
      'Each theme is scored on demand, timing, competition, hiring, regulation and India relevance.',
  },
  {
    icon: ShieldCheck,
    title: 'Evidence attached',
    description:
      'Every score shows the raw signals behind it. Claims are checkable, never just trusted.',
  },
];

const TIERS = [
  {
    badge: 'Live AI',
    badgeVariant: 'emerald',
    title: 'Model analysis',
    description: 'When a key is configured and quota remains, Gemini reads the corpus and writes the brief.',
  },
  {
    badge: 'Cached',
    badgeVariant: 'indigo',
    title: 'Fast repeats',
    description: 'Identical requests are cached for 24 hours, so the feed stays instant and cheap.',
  },
  {
    badge: 'Offline heuristic',
    badgeVariant: 'amber',
    title: 'Never blanks',
    description:
      'No key, spent quota or unreachable database — you still get a deterministic, labelled result.',
  },
];

const SOURCES = [
  { icon: Landmark, label: 'RBI circulars' },
  { icon: Building2, label: 'SEBI circulars' },
  { icon: Braces, label: 'GitHub activity' },
  { icon: MessagesSquare, label: 'Reddit threads' },
  { icon: Users, label: 'Hiring posts' },
];

const INDIA_PILLARS = [
  {
    icon: Landmark,
    title: 'DPI-native signal reading',
    description:
      'UPI, ONDC, Account Aggregator, e-Rupee — the rails India actually builds on. Not a playbook imported from the Valley.',
    proHook: 'Pro maps every rail-level opening before it becomes obvious',
  },
  {
    icon: ScrollText,
    title: 'Regulation is the alpha source',
    description:
      'In India a single RBI or SEBI circular can create an entire category in one quarter. We watch both regulators daily.',
    proHook: 'Clause-by-clause regulatory moat maps, inside every Pro brief',
  },
  {
    icon: BadgeIndianRupee,
    title: 'INR economics, not folklore',
    description:
      'Unit economics, pricing scenarios and salary benchmarks built on Indian numbers, for Indian margins.',
    proHook: 'Full CAC, LTV and payback models unlocked in Pro',
  },
  {
    icon: Briefcase,
    title: 'Hiring as ground truth',
    description:
      'Live job posts from Bengaluru to Bhubaneswar reveal where smart money is quietly hiring before it hits the news.',
    proHook: 'Role-level hiring maps and verified salary bands in Pro',
  },
  {
    icon: TrendingUp,
    title: 'Bharat-scale market math',
    description:
      'TAM, SAM and SOM in ₹, sized for 140 crore consumers and the Tier-2/Tier-3 wave the metros missed.',
    proHook: 'Sourced sizing models with assumptions you can challenge',
  },
  {
    icon: Rocket,
    title: 'For founders and product teams',
    description:
      'Solo founders validating a first idea, or product heads at Indian SaaS scouting the next line — the briefs are built to be acted on.',
    proHook: '90-day GTM playbooks and 12-month roadmaps in every Pro report',
  },
];

const PREVIEW_ROWS = [
  {
    title: 'UPI-linked credit line rails',
    change: '+18%',
    score: 84,
    up: true,
    tags: ['fintech', 'regulation'],
    badge: 'Live AI',
    badgeVariant: 'emerald',
  },
  {
    title: 'Sachet fintech for Tier-2 merchants',
    change: '+11%',
    score: 72,
    up: true,
    tags: ['payments', 'SMB'],
    badge: 'Cached',
    badgeVariant: 'indigo',
  },
  {
    title: 'ONDC seller tooling',
    change: '+6%',
    score: 66,
    up: true,
    tags: ['commerce'],
    badge: 'Live AI',
    badgeVariant: 'emerald',
  },
  {
    title: 'Compliance automation for NBFCs',
    change: '-3%',
    score: 58,
    up: false,
    tags: ['regtech'],
    badge: 'Offline heuristic',
    badgeVariant: 'amber',
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{description}</p>
      ) : null}
    </div>
  );
}

function RadarPreview() {
  return (
    <Card tone="glass" className="w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <RadarIcon className="h-4 w-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-on-surface">Radar</span>
        </div>
        <Badge variant="outline">Illustrative sample</Badge>
      </div>
      <div className="divide-y divide-border/50">
        {PREVIEW_ROWS.map((row) => (
          <div key={row.title} className="flex items-center gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-on-surface">{row.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {row.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-low px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant"
                  >
                    {tag}
                  </span>
                ))}
                <Badge variant={row.badgeVariant} className="px-1.5 text-[8px]">
                  {row.badge}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="mono text-sm font-black text-on-surface">{row.score}</p>
              <p
                className={`text-[10px] font-bold ${
                  row.up ? 'text-emerald-signal' : 'text-rose-signal'
                }`}
              >
                {row.change}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 px-5 py-3">
        <p className="text-[10px] leading-relaxed text-on-surface-variant">
          Every row links to its brief: the hiring, regulatory and community signals behind the score.
        </p>
      </div>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <BrandLockup />
          <nav className="hidden items-center gap-6 text-xs font-bold text-on-surface-variant md:flex">
            <a href="#built-for-india" className="transition-colors hover:text-on-surface">
              Built for India
            </a>
            <Link href="/sample-report" className="transition-colors hover:text-on-surface">
              Sample report
            </Link>
            <a href="#features" className="transition-colors hover:text-on-surface">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-on-surface">
              How it works
            </a>
            <a href="#honesty" className="transition-colors hover:text-on-surface">
              Honesty
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeSwitcher compact />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/radar">
                Open radar
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <RadarBackground />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-24">
            <div className="animate-slide-up-fade">
              <Badge variant="primary" className="mb-5">
                <Sparkles />
                Opportunity radar for Indian founders &amp; product companies
              </Badge>
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
                Don&apos;t start from an idea. <span className="text-gradient">Start from the signal.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-on-surface-variant">
                Built for Indian founders and product companies. FounderSignal reads hiring posts,
                RBI and SEBI circulars, community threads and open-source activity around the
                clock, clusters them into themes, and hands you scored opportunity briefs — with
                the raw evidence attached. In India, one circular can mint a category in a
                quarter; the people watching win first.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/radar">
                    Explore the radar
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/idea-validator">
                    <Lightbulb />
                    Validate your idea
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Badge variant="emerald">Live AI</Badge>
                <Badge variant="indigo">Cached</Badge>
                <Badge variant="amber">Offline heuristic</Badge>
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  every result wears its source
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <RadarPreview />
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface-low/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 sm:px-6">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
              Watching
            </span>
            {SOURCES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 text-xs font-bold text-on-surface-variant"
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </section>

        <section id="built-for-india" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20 sm:px-6">
          <SectionHeading
            eyebrow="Made for this market"
            title="Built for Indian founders and product companies"
            description="Silicon Valley tools read American signals. FounderSignal is engineered for the way categories actually form in India — through DPI rails, regulator circulars, INR economics and hiring waves you won't find in a global report."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INDIA_PILLARS.map(({ icon: Icon, title, description, proHook }) => (
              <Card key={title} tone="glass" className="tile-rise flex h-full flex-col p-5">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-black tracking-tight text-on-surface">{title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-on-surface-variant">{description}</p>
                <p className="mt-4 flex items-start gap-1.5 rounded-lg border border-primary/25 bg-primary/5 p-2.5 text-[11px] font-bold leading-snug text-on-surface">
                  <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {proHook}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-border/60 bg-surface-low/40 px-5 py-4 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">
              The next Indian decacorn is hiding in a circular nobody read yet.
              <span className="font-black text-on-surface"> Pro members see it first. </span>
            </p>
            <Link
              href="/sample-report"
              className="inline-flex items-center gap-1.5 text-xs font-black text-primary transition-opacity hover:opacity-80"
            >
              See what a Pro-grade brief looks like
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Card tone="strong" className="accent-top relative overflow-hidden p-6 sm:p-8">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div>
                <Badge variant="primary" className="mb-4">
                  <FileText />
                  Read before you buy
                </Badge>
                <h2 className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
                  See a full sample brief — free, unlocked, no login
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                  Mock data in the real shape of every report: a composite score you can interrogate,
                  an evidence trail you can check, market math in ₹ — and a deep-dive layer that Pro
                  unlocks. Judge the quality first, then decide.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/sample-report">
                      <FileText />
                      Read the sample brief
                      <ArrowRight />
                    </Link>
                  </Button>
                  <p className="text-[11px] font-semibold text-on-surface-variant">
                    2-minute read · labelled as sample throughout
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '84', label: 'Composite score' },
                  { value: '4', label: 'Signal streams' },
                  { value: '12', label: 'Report sections' },
                  { value: '₹', label: 'Indian market math' },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border/70 bg-surface-low/50 p-4 text-center"
                  >
                    <p className="mono text-2xl font-black text-on-surface">{value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Features"
            title="From scattered noise to a decision you can defend"
            description="Six surfaces, one corpus. Each answers a different question, all grounded in the same live signals."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ href, icon: Icon, badge, badgeVariant, title, description }) => (
              <Link key={href} href={href} className="group focus-visible:outline-none">
                <Card tone="glass" className="tile-rise h-full p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <Badge variant={badgeVariant}>{badge}</Badge>
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-on-surface">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-black text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-surface-low/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeading
              eyebrow="How it works"
              title="A pipeline you can inspect"
              description="Nothing is a black box: each signal, cluster and score has an origin the UI will show you."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <Card key={title} tone="glass" className="relative p-5">
                  <span className="mono absolute right-4 top-4 text-[10px] font-bold text-on-surface-variant/70">
                    0{index + 1}
                  </span>
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-black tracking-tight text-on-surface">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="honesty" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Honest by design"
            title="It never blanks, and it never pretends"
            description="Every external dependency has a fallback. Every result tells you which tier produced it, and every downgrade names the cause and the remedy."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map(({ badge, badgeVariant, title, description }) => (
              <Card key={badge} tone="glass" className="p-5">
                <Badge variant={badgeVariant} className="mb-4">
                  {badge}
                </Badge>
                <h3 className="text-sm font-black tracking-tight text-on-surface">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <Card tone="strong" className="accent-top relative overflow-hidden p-8 text-center sm:p-12">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
            <div className="relative">
              <Compass className="mx-auto mb-4 h-8 w-8 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
                India&apos;s next category is forming right now
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                Free: open the radar and see what moved today, no login required. Ready to dig?
                Read the sample brief, then unlock the Pro layer — the economics, maps and
                playbooks that turn a signal into a decision.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/radar">
                    <RadarIcon />
                    Open the radar
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/sample-report">
                    <FileSearch />
                    Read the sample brief
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-surface-low/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <BrandLockup />
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-on-surface-variant">
              Opportunity intelligence for Indian founders and product companies. Scored briefs
              built from live hiring, regulatory, community and open-source signals.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
              <ServerCog className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Built for the Indian market
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface">Product</p>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold text-on-surface-variant">
              <li>
                <Link href="/radar" className="transition-colors hover:text-on-surface">
                  Opportunity Radar
                </Link>
              </li>
              <li>
                <Link href="/idea-validator" className="transition-colors hover:text-on-surface">
                  Idea Validator
                </Link>
              </li>
              <li>
                <Link href="/sample-report" className="transition-colors hover:text-on-surface">
                  Sample brief
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface">Account &amp; legal</p>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold text-on-surface-variant">
              <li>
                <Link href="/login" className="transition-colors hover:text-on-surface">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-on-surface">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-on-surface">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#disclaimer" className="transition-colors hover:text-on-surface">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60">
          <div id="disclaimer" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-6 sm:px-6">
            <p className="text-[11px] leading-relaxed text-on-surface-variant/80">
              <strong className="font-black uppercase tracking-wider text-on-surface-variant">Disclaimer:</strong>{' '}
              FounderSignal briefs, scores and figures are generated automatically from publicly
              available market signals — hiring posts, regulatory circulars, community threads and
              open-source activity — and, in part, by AI models. They are provided for information
              and education only and do not constitute financial, investment, legal or regulatory
              advice. We do not guarantee accuracy and we are not responsible for, or liable for,
              any decision made or outcome arising from this output. Always conduct your own
              research and fact-check independently before committing money to any idea.
            </p>
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-4 text-[11px] font-semibold text-on-surface-variant sm:flex-row">
              <p>© 2026 FounderSignal. All rights reserved.</p>
              <p className="flex items-center gap-1.5">
                Made for Indian builders
                <Link href="/terms" className="text-primary transition-opacity hover:opacity-80">
                  Terms
                </Link>
                <Link href="/privacy" className="text-primary transition-opacity hover:opacity-80">
                  Privacy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
