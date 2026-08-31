'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/shell/theme-provider';
import { SubscriptionProvider } from '@/context/subscription-context';
import { PricingModal } from '@/components/opportunity/pricing-modal';
import { SplashScreen } from '@/components/shell/splash-screen';

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
