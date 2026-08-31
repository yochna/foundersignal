'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const SubscriptionContext = React.createContext({
  isPro: false,
  plan: 'free',
  isPricingModalOpen: false,
  isCheckingOut: false,
  openPricingModal: () => {},
  closePricingModal: () => {},
  startCheckout: (planName) => {},
  downgradeToFree: () => {},
});

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay checkout')));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export function SubscriptionProvider({ children }) {
  const { data: session } = useSession();
  const [isPro, setIsPro] = React.useState(false);
  const [plan, setPlan] = React.useState('free');
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

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
  }, [session, refreshEntitlement]);

  const openPricingModal = React.useCallback(() => setIsPricingModalOpen(true), []);
  const closePricingModal = React.useCallback(() => setIsPricingModalOpen(false), []);

  const startCheckout = React.useCallback(
    async (planType = 'venture_pro') => {
      setIsCheckingOut(true);
      try {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planType }),
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
          toast.success('Pro unlocked (demo mode)', {
            description: 'Razorpay keys are not configured yet, so this is a free demo grant, not a real charge.',
            duration: 6000,
          });
          return;
        }

        await loadRazorpayScript();

        const razorpay = new window.Razorpay({
          key: orderData.keyId,
          order_id: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'FounderSignal',
          description: orderData.planLabel,
          prefill: orderData.prefill,
          theme: { color: '#6366f1' },
          handler: async (response) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData?.ok) throw new Error('Payment could not be verified');
              await refreshEntitlement();
              setIsPricingModalOpen(false);
              toast.success('🎉 Welcome to FounderSignal Pro!', {
                description: 'Payment verified. All briefs and features are unlocked.',
                duration: 5000,
              });
            } catch (error) {
              toast.error('Payment received but verification failed', {
                description: 'Contact support with your payment id — you were charged but not yet upgraded.',
              });
            }
          },
          modal: {
            ondismiss: () => {
              toast.info('Checkout closed. No payment was made.');
            },
          },
        });

        razorpay.on('payment.failed', (response) => {
          toast.error('Payment failed', { description: response?.error?.description || 'Please try again.' });
        });

        razorpay.open();
      } catch (error) {
        toast.error('Could not start checkout', { description: error.message });
      } finally {
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
      isPricingModalOpen,
      isCheckingOut,
      openPricingModal,
      closePricingModal,
      startCheckout,
      downgradeToFree,
    }),
    [isPro, plan, isPricingModalOpen, isCheckingOut, mounted, openPricingModal, closePricingModal, startCheckout, downgradeToFree]
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
