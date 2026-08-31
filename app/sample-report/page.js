import Link from 'next/link';
import { ArrowLeft, ArrowRight, Radar as RadarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLockup } from '@/components/shell/brand';
import { ThemeSwitcher } from '@/components/shell/theme-switcher';
import { SampleReport } from '@/components/landing/sample-report';

export const metadata = {
  title: 'Sample brief — UPI-linked credit line rails',
  description:
    'A full FounderSignal opportunity brief rendered with mock data: composite score, score breakdown, evidence trail, market sizing and the deep-dive layer Pro unlocks. Free to read, no login required.',
};

export default function SampleBriefPage() {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md focus-visible:outline-none"
            aria-label="Back to FounderSignal home"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant transition-colors hover:text-on-surface">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Home
            </span>
          </Link>
          <BrandLockup compact />
          <div className="flex items-center gap-2">
            <ThemeSwitcher compact />
            <Button asChild size="sm">
              <Link href="/radar">
                Open radar
                <RadarIcon />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            Read before you buy
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
            A full sample brief, <span className="text-gradient">free and unlocked</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
            This is mock data in the real shape of every report: scores you can interrogate,
            evidence you can check, and a deep-dive layer that Pro unlocks. No login required —
            judge the quality first, then decide.
          </p>
        </div>

        <SampleReport />

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-lg text-xs leading-relaxed text-on-surface-variant">
            The live radar refreshes with real signals every day. If this sample earned a second
            look, the next step is seeing what is actually moving in the market right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/radar">
                <RadarIcon />
                Open the live radar
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/#built-for-india">
                Why India, why now
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 bg-surface-low/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:px-6 md:flex-row md:text-left">
          <p className="text-[11px] font-semibold text-on-surface-variant">
            © 2026 FounderSignal · Opportunity intelligence for Indian founders and product companies
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-on-surface-variant">
            <Link href="/" className="transition-colors hover:text-on-surface">
              Home
            </Link>
            <Link href="/radar" className="transition-colors hover:text-on-surface">
              Radar
            </Link>
            <Link href="/terms" className="transition-colors hover:text-on-surface">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-on-surface">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
