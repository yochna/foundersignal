'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/shell/theme-provider';
import { SubscriptionProvider } from '@/context/subscription-context';
import { PricingModal } from '@/components/opportunity/pricing-modal';
import { SplashScreen } from '@/components/shell/splash-screen';

// Defined inside a Client Component so the `beforeSend` callback never has to
// cross the server -> client boundary (functions aren't serializable props
// on a Server Component like app/layout.js).
function ScopedAnalytics() {
  return <Analytics beforeSend={(event) => (event.url.includes('/admin') ? null : event)} />;
}

/** Client-side provider stack. Kept in one file so app/layout.js stays a server component. */
export function Providers({ initialTheme, children }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider initialTheme={initialTheme}>
        <SubscriptionProvider>
          <TooltipProvider delayDuration={250} skipDelayDuration={400}>
            <SplashScreen />
            {children}
            <PricingModal />
            <ScopedAnalytics />
            <Toaster
              position="bottom-right"
              closeButton
              toastOptions={{
                className: 'glass-strong !rounded-xl !text-xs !font-semibold',
                style: {
                  background: 'var(--bg-surface-container)',
                  color: 'var(--text-on-surface)',
                  border: '1px solid var(--border-color)',
                },
              }}
            />
          </TooltipProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default Providers;
