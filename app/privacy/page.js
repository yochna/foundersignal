import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { BrandLockup } from '@/components/shell/brand';
import { ThemeSwitcher } from '@/components/shell/theme-switcher';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How FounderSignal collects, uses and protects your data. Plain-language privacy policy for an Indian startup opportunity intelligence platform.',
};

const LAST_UPDATED = 'August 2026';

const SECTIONS = [
  {
    heading: '1. What data we collect',
    body: [
      'When you create an account we receive the email address supplied by your sign-in method (Google or direct email) and basic profile fields such as your name, if provided.',
      'We also log standard technical information such as pages visited, device and browser details, and errors, so we can operate and improve the Service.',
    ],
  },
  {
    heading: '2. How we use your data',
    body: [
      'Your account data is used to authenticate you, apply your plan limits, save your saved themes and preferences, and maintain your usage history within the app.',
      'We may use aggregate, anonymised usage patterns to improve features and decide what to build next. We do not profile individual users for advertising.',
    ],
  },
  {
    heading: '3. Cookies and local storage',
    body: [
      'We use strictly necessary cookies and browser storage for authentication sessions and for remembering your theme and subscription state. These are functional, not advertising cookies.',
      'You can clear these at any time from your browser settings; doing so will sign you out and reset local preferences.',
    ],
  },
  {
    heading: '4. Where your data is stored',
    body: [
      'Account and application data is stored in our Supabase (PostgreSQL) database. Signals and briefs are generated from public sources and are not tied to your identity.',
      'We take reasonable technical and organisational measures to protect your data, but no method of transmission or storage is completely secure.',
    ],
  },
  {
    heading: '5. Public signals and third-party sources',
    body: [
      'FounderSignal reads publicly available information — hiring posts, regulatory circulars, community threads and open-source activity. This data is processed to build market insights and is not used to identify or contact individuals.',
      'We do not sell, rent or trade your personal data to third parties.',
    ],
  },
  {
    heading: '6. Payments',
    body: [
      'Payments for paid plans are processed by our payment providers. Card numbers, UPI credentials and similar payment details are handled by those providers and are never stored on our servers.',
      'We retain only the minimum information needed to manage your subscription, such as the plan type and status.',
    ],
  },
  {
    heading: '7. Your rights',
    body: [
      'You may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete your account and associated data. Requests are honoured within a reasonable timeframe, subject to legal retention obligations.',
      'If you are located in India, this policy is intended to be consistent with applicable requirements under the Digital Personal Data Protection Act, 2023.',
    ],
  },
  {
    heading: '8. Data retention',
    body: [
      'Account data is retained for as long as your account is active. When you request deletion, we remove personal data and retain only anonymised aggregates.',
      'Technical logs are kept for a limited period needed for security and debugging.',
    ],
  },
  {
    heading: '9. Changes to this policy',
    body: [
      'We may update this policy from time to time. The "Last updated" date at the top reflects the latest revision. Continued use of the Service after changes are published constitutes acceptance of the revised policy.',
    ],
  },
  {
    heading: '10. Contact',
    body: [
      'Questions about this policy can be raised by emailing mail.jaiswal@gmail.com.',
    ],
  },
];

export default function PrivacyPage() {
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
            <ShieldCheck />
            Legal
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-on-surface sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-xs font-semibold text-on-surface-variant">
            Last updated: {LAST_UPDATED}
          </p>
          <div className="mt-6 rounded-xl border border-amber-signal/30 bg-amber-signal/10 p-4">
            <p className="text-xs leading-relaxed text-on-surface">
              <strong>The short version:</strong> we collect the minimum needed to run your account,
              we never sell your data, and payment details live with our payment providers — not us.
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
            Also read our <Link href="/terms" className="font-bold text-primary hover:underline">Terms &amp; Conditions</Link>, or
            return to the <Link href="/" className="font-bold text-primary hover:underline">home page</Link>.
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
