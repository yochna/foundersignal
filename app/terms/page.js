import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import { BrandLockup } from '@/components/shell/brand';
import { ThemeSwitcher } from '@/components/shell/theme-switcher';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms of use for FounderSignal. Signals are aggregated from public sources and are informational only — they are not financial, investment or legal advice.',
};

const LAST_UPDATED = 'August 2026';

const SECTIONS = [
  {
    heading: '1. Acceptance of these terms',
    body: [
      'By accessing or using FounderSignal (the "Service"), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you should not use the Service.',
      'We may update these terms from time to time. Continued use of the Service after changes are published constitutes acceptance of the revised terms.',
    ],
  },
  {
    heading: '2. Nature of the Service',
    body: [
      'FounderSignal aggregates and analyses information that is already public — hiring posts, regulatory circulars (including RBI and SEBI publications), developer forum and community threads, and open-source repository activity. It clusters these signals into themes and generates scored opportunity briefs, partly with the assistance of AI models.',
      'Outputs are generated from patterns in public data and model interpretation. They reflect statistical signals at a point in time, not forecasts, endorsements or recommendations.',
    ],
  },
  {
    heading: '3. No financial, investment or legal advice',
    body: [
      'All content provided by the Service — including scores, briefs, market-sizing figures, unit-economics models, roadmaps and AI-generated answers — is provided for informational and educational purposes only.',
      'Nothing on the Service constitutes financial advice, investment advice, legal advice, regulatory advice, or an offer or solicitation to buy or sell any security or financial instrument.',
      'FounderSignal is not a SEBI-registered research analyst, investment adviser or broker, and does not hold itself out as one.',
    ],
  },
  {
    heading: '4. Your responsibility to verify',
    body: [
      'Market signals can be incomplete, outdated, misread or misleading. Regulatory circulars must be read in full and in context before any business decision is made on their basis.',
      'You are solely responsible for performing your own due diligence — including independent research, fact-checking, regulatory review and professional advice — before committing time, capital or other resources to any idea, company or opportunity surfaced by the Service.',
    ],
  },
  {
    heading: '5. No warranty on outputs',
    body: [
      'The Service is provided on an "as is" and "as available" basis. We do not warrant that outputs are accurate, complete, current, reliable, error-free or fit for any particular purpose.',
      'AI-assisted features may produce incorrect or incomplete statements even when sources are cited. Cited sources do not guarantee the correctness of any conclusion drawn from them.',
    ],
  },
  {
    heading: '6. Limitation of liability',
    body: [
      'To the maximum extent permitted by applicable law, FounderSignal and its operators shall not be liable for any direct, indirect, incidental, consequential or special damages — including loss of profits, revenue, data, opportunity or goodwill — arising from your use of, or reliance on, any output of the Service.',
      'You use the Service and act on its outputs entirely at your own risk.',
    ],
  },
  {
    heading: '7. Subscriptions and payments',
    body: [
      'Paid plans, where offered, grant access to additional content and features as described at the point of purchase. Fees are stated in Indian Rupees unless otherwise noted.',
      'Unless a specific refund policy is stated at checkout, payments are non-refundable; statutory consumer rights are not affected. We may change plan pricing for future renewals with reasonable notice.',
      'You may cancel at any time; access continues until the end of the paid period.',
    ],
  },
  {
    heading: '8. Accounts and acceptable use',
    body: [
      'You are responsible for keeping your account credentials confidential and for all activity under your account.',
      'You agree not to misuse the Service, including attempting to scrape, resell or redistribute its outputs as a competing product, probe or disrupt its infrastructure, or use it for any unlawful purpose.',
    ],
  },
  {
    heading: '9. Intellectual property',
    body: [
      'The Service, its design, code and original content are owned by FounderSignal and protected by applicable intellectual property laws. Third-party sources remain the property of their respective publishers; we reference public information and do not claim ownership of it.',
      'You may reference brief outputs with attribution for personal, non-commercial use.',
    ],
  },
  {
    heading: '10. Governing law',
    body: [
      'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in India.',
    ],
  },
  {
    heading: '11. Contact',
    body: [
      'Questions about these terms can be raised by emailing mail.jaiswal@gmail.com.',
    ],
  },
];

export default function TermsPage() {
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
          <ThemeSwitcher compact />
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <Badge variant="primary" className="mb-4">
            <Scale />
            Legal
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-xs font-semibold text-on-surface-variant">
            Last updated: {LAST_UPDATED}
          </p>
          <div className="mt-6 rounded-xl border border-amber-signal/30 bg-amber-signal/10 p-4">
            <p className="text-xs leading-relaxed text-on-surface">
              <strong>The short version:</strong> FounderSignal is built from public market signals.
              Its outputs are informational only — not financial, investment or legal advice. We are
              not responsible or liable for decisions you make based on them. Do your own research
              before putting money into any idea.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {SECTIONS.map(({ heading, body }) => (
            <section key={heading}>
              <h2 className="text-sm font-black uppercase tracking-wider text-on-surface">{heading}</h2>
              {body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mt-2.5 text-sm leading-relaxed text-on-surface-variant">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border/70 bg-surface-low/40 p-5 text-center">
          <p className="text-xs leading-relaxed text-on-surface-variant">
            Read the <Link href="/sample-report" className="font-bold text-primary hover:underline">sample brief</Link> to
            see exactly what our outputs look like, or return to the{' '}
            <Link href="/" className="font-bold text-primary hover:underline">home page</Link>.
          </p>
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
