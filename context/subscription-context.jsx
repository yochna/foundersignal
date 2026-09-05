'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const SubscriptionContext = React.createContext({
  isPro: false,
  plan: 'free',
  paymentsLive: true,
  isPricingModalOpen: false,
  isCheckingOut: false,
  openPricingModal: () => {},
  closePricingModal: () => {},
  startCheckout: (planName) => {},
  downgradeToFree: () => {},
});

export function SubscriptionProvider({ children }) {
  const { data: session } = useSession();
  const [isPro, setIsPro] = React.useState(false);
  const [plan, setPlan] = React.useState('free');
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  // Assume live until /api/health says otherwise, so the CTA never flashes
  // the "demo" copy for a split second on a real, fully-configured deploy.
  const [paymentsLive, setPaymentsLive] = React.useState(true);

  const refreshEntitlement = React.useCallback(async () => {
    try {
      const res = await fetch('/api/plan', { cache: 'no-store' });
      if (!res.ok) throw new Error('plan lookup failed');
      const data = await res.json();
      if (!data?.ok) return;
      const pro = Boolean(data.isPro);
      setIsPro(pro);
      setPlan(pro ? data.plan || 'venture_pro' : 'free');
    } catch {
      // Leave whatever state is already in memory; the next successful poll corrects it.
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    refreshEntitlement();

    let cancelled = false;
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const configured = data?.subsystems?.payments?.configured;
        if (typeof configured === 'boolean') setPaymentsLive(configured);
      })
      .catch(() => {
        // Leave the optimistic default; the pricing modal still works either way.
      });
    return () => {
      cancelled = true;
    };
  }, [session, refreshEntitlement]);

  // Checkout now redirects to a Lemon Squeezy-hosted checkout page and back.
  // Unlike the Razorpay Payment Links flow this replaced, Lemon Squeezy's
  // redirect_url doesn't carry a verifiable signed proof of payment — the
  // webhook (see app/api/payments/lemonsqueezy-webhook/route.js) is the only
  // place access actually gets granted, and it's normally near-instant. So
  // instead of verifying anything client-side, this just polls /api/plan for
  // a few seconds after returning, waiting for the webhook to have landed.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('fs_payment') !== '1') return;

    // Strip the query param immediately, so a page refresh doesn't re-poll.
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);

    let cancelled = false;
    const attempts = 8;
    const intervalMs = 2000;

    const poll = async (attempt) => {
      if (cancelled) return;
      try {
        const res = await fetch('/api/plan', { cache: 'no-store' });
        const data = await res.json();
        if (data?.ok && data.isPro) {
          setIsPro(true);
          setPlan(data.plan || 'venture_pro');
          setIsPricingModalOpen(false);
          toast.success('🎉 Welcome to FounderSignal Pro!', {
            description: 'Payment confirmed. All briefs and features are unlocked.',
            duration: 5000,
          });
          return;
        }
      } catch {
        // Keep polling; a single failed request isn't reason to give up early.
      }

      if (attempt < attempts) {
        setTimeout(() => poll(attempt + 1), intervalMs);
      } else {
        toast.info('Still confirming your payment…', {
          description:
            'This can take a minute. Refresh the page shortly — if it was charged, access unlocks automatically once confirmed.',
          duration: 8000,
        });
      }
    };

    poll(1);
    return () => {
      cancelled = true;
    };
    // Runs once on mount per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPricingModal = React.useCallback(() => setIsPricingModalOpen(true), []);
  const closePricingModal = React.useCallback(() => setIsPricingModalOpen(false), []);

  const startCheckout = React.useCallback(
    async (planType = 'venture_pro') => {
      setIsCheckingOut(true);
      try {
        const returnPath = window.location.pathname + window.location.search;
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planType, returnPath }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData?.ok) {
          throw new Error(orderData?.error?.message || orderData?.message || 'Could not start checkout');
        }

        // No Lemon Squeezy keys configured yet: fall back to a labelled demo
        // grant instead of a broken checkout, same as every other AI/data
        // feature in this app degrades rather than erroring.
        if (orderData.demo) {
          const demoRes = await fetch('/api/payments/demo-upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: planType }),
          });
          const demoData = await demoRes.json();
          if (!demoRes.ok || !demoData?.ok) throw new Error('Demo upgrade failed');
          await refreshEntitlement();
          setIsPricingModalOpen(false);
          toast.success('Pro unlocked — free early access', {
            description: 'Payments are launching soon; this is free for now, not a real charge.',
            duration: 6000,
          });
          return;
        }

        // Redirect to Lemon Squeezy's hosted checkout page. The browser comes
        // back to returnPath with ?fs_payment=1, picked up by the polling
        // effect above.
        window.location.href = orderData.url;
      } catch (error) {
        toast.error('Could not start checkout', { description: error.message });
        setIsCheckingOut(false);
      }
    },
    [refreshEntitlement]
  );

  const downgradeToFree = React.useCallback(async () => {
    try {
      await fetch('/api/payments/demo-upgrade', { method: 'DELETE' });
    } catch {}
    await refreshEntitlement();
    toast.info('Switched to Free plan view.');
  }, [refreshEntitlement]);

  const value = React.useMemo(
    () => ({
      isPro: mounted ? isPro : false,
      plan: mounted ? plan : 'free',
      paymentsLive,
      isPricingModalOpen,
      isCheckingOut,
      openPricingModal,
      closePricingModal,
      startCheckout,
      downgradeToFree,
    }),
    [
      isPro,
      plan,
      paymentsLive,
      isPricingModalOpen,
      isCheckingOut,
      mounted,
      openPricingModal,
      closePricingModal,
      startCheckout,
      downgradeToFree,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionProvider;
