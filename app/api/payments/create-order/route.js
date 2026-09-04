import { randomUUID } from 'node:crypto';
import { withApi, readJson, parseWith } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createOrderRequest } from '@/lib/schemas';
import { repo } from '@/lib/db';
import { createPaymentLink, getPlan } from '@/lib/payments/razorpay';
import { hasRazorpay, appUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Starts a checkout by creating a Razorpay Payment Link — a hosted checkout
 * page. Simpler than the old Orders API flow: no checkout.js script, no
 * client-side signature verification modal, the browser just redirects to
 * Razorpay and back. When Razorpay is not configured, tells the client to
 * use the demo-upgrade route instead — same "labelled fallback" pattern the
 * rest of the app uses for AI and ingestion.
 */
export const POST = withApi(async (request) => {
  const user = await requireUser();
  const { plan: planId, returnPath } = parseWith(createOrderRequest, await readJson(request));

  if (!hasRazorpay) {
    return { demo: true, plan: planId };
  }

  const plan = getPlan(planId);
  const receipt = `fs_${planId}_${randomUUID().slice(0, 12)}`;

  const origin = request.headers.get('origin') || appUrl || new URL(request.url).origin;
  const safePath = typeof returnPath === 'string' && returnPath.startsWith('/') ? returnPath : '/';
  const callbackUrl = `${origin}${safePath}${safePath.includes('?') ? '&' : '?'}fs_payment=1`;

  const link = await createPaymentLink({
    planId,
    receipt,
    notes: { userId: user.id, email: user.email || '' },
    prefill: { name: user.name || '', email: user.email || '' },
    callbackUrl,
  });

  await repo.createPaymentOrder({
    id: receipt,
    userId: user.id,
    plan: planId,
    amountPaise: plan.amountPaise,
    currency: plan.currency,
  });

  return {
    demo: false,
    url: link.short_url,
    plan: planId,
    planLabel: plan.label,
  };
});
