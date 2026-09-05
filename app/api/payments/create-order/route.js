import { randomUUID } from 'node:crypto';
import { withApi, readJson, parseWith } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createOrderRequest } from '@/lib/schemas';
import { repo } from '@/lib/db';
import { createCheckout } from '@/lib/payments/lemonsqueezy';
import { getPlan } from '@/lib/payments/plans';
import { hasLemonsqueezy, appUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Starts a checkout by creating a Lemon Squeezy hosted checkout session.
 * No PAN/business-registration gate, since Lemon Squeezy is the Merchant of
 * Record. When it's not configured yet, tells the client to use the
 * demo-upgrade route instead — same "labelled fallback" pattern the rest of
 * the app uses for AI and ingestion.
 */
export const POST = withApi(async (request) => {
  const user = await requireUser();
  const { plan: planId, returnPath } = parseWith(createOrderRequest, await readJson(request));

  if (!hasLemonsqueezy) {
    return { demo: true, plan: planId };
  }

  const plan = getPlan(planId);
  const receipt = `fs_${planId}_${randomUUID().slice(0, 12)}`;

  const origin = request.headers.get('origin') || appUrl || new URL(request.url).origin;
  const safePath = typeof returnPath === 'string' && returnPath.startsWith('/') ? returnPath : '/';
  const redirectUrl = `${origin}${safePath}${safePath.includes('?') ? '&' : '?'}fs_payment=1`;

  const checkout = await createCheckout({ user, redirectUrl, receipt });

  await repo.createPaymentOrder({
    id: receipt,
    userId: user.id,
    plan: planId,
    amountPaise: plan.amountPaise,
    currency: plan.currency,
  });

  return {
    demo: false,
    url: checkout.url,
    plan: planId,
    planLabel: plan.label,
  };
});
