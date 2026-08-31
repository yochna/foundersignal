import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from '@/components/providers';
import { DEFAULT_THEME, THEME_COOKIE, normalizeTheme, themeBootstrapScript } from '@/lib/themes';
import { appUrl } from '@/lib/config';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'FounderSignal — Indian startup opportunity radar',
    template: '%s · FounderSignal',
  },
  description:
    'AI-powered opportunity intelligence for Indian founders and builders. Scored startup opportunities built from live hiring, regulatory, community and technology signals.',
  keywords: [
    'startup opportunities India',
    'market validation',
    'RBI SEBI regtech',
    'idea validator',
    'founder tools',
  ],
  openGraph: {
    title: 'FounderSignal — Indian startup opportunity radar',
    description:
      'Turn scattered market signals into scored, evidence-backed startup opportunity briefs for the Indian market.',
    type: 'website',
    siteName: 'FounderSignal',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FounderSignal — Indian startup opportunity radar',
    description:
      'Scored startup opportunity briefs built from live hiring, regulatory, community and open-source signals for the Indian market.',
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FounderSignal',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070b14' },
    { media: '(prefers-color-scheme: light)', color: '#faf5ee' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  // Reading the theme server-side means the correct tokens are present in the
  // very first HTML, so there is no flash of the default theme on load.
  const theme = normalizeTheme(cookies().get(THEME_COOKIE)?.value || DEFAULT_THEME);

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <head>
        {/* Reconciles the cookie with localStorage before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-on-primary"
        >
          Skip to content
        </a>
        <Providers initialTheme={theme}>{children}</Providers>
        <Analytics beforeSend={(event) => (event.url.includes('/admin') ? null : event)} />
      </body>
    </html>
  );
}
