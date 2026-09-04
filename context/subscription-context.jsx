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

  // Checkout now redirects to a Razorpay-hosted Payment Link page and back,
  // rather than opening a client-side checkout.js modal. On return, Razorpay
  // appends razorpay_payment_link_* query params to the callback_url we
  // registered when the link was created; this effect picks those up,
  // verifies the signature server-side, and unlocks access immediately.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('fs_payment') !== '1') return;

    const paymentLinkId = params.get('razorpay_payment_link_id');
    const referenceId = params.get('razorpay_payment_link_reference_id');
    const paymentLinkStatus = params.get('razorpay_payment_link_status');
    const paymentId = params.get('razorpay_payment_id');
    const signature = params.get('razorpay_signature');

    // Strip the query params immediately either way, so a page refresh
    // doesn't re-trigger verification or leave Razorpay params in the URL.
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);

    if (!paymentLinkId || !referenceId || !paymentLinkStatus || !paymentId || !signature) {
      return;
    }

    if (paymentLinkStatus !== 'paid') {
      toast.info('Checkout closed. No payment was made.');
      return;
    }

    fetch('/api/payments/verify-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentLinkId, referenceId, paymentLinkStatus, paymentId, signature }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error?.message || 'Payment could not be verified');
        await refreshEntitlement();
        toast.success('🎉 Welcome to FounderSignal Pro!', {
          description: 'Payment verified. All briefs and features are unlocked.',
          duration: 5000,
        });
      })
      .catch(() => {
        toast.error('Payment received but verification failed', {
          description: 'Contact support with your payment id — you were charged but not yet upgraded.',
        });
      });
    // Runs once on mount per page load; refreshEntitlement is stable.
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

        // No Razorpay keys configured yet: fall back to a labelled demo grant
        // instead of a broken checkout, same as every other AI/data feature
        // in this app degrades rather than erroring.
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

        // Redirect to Razorpay's hosted Payment Link page. The browser comes
        // back to returnPath with ?fs_payment=1 and Razorpay's signed query
        // params, picked up by the effect above.
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
