import { randomUUID } from 'node:crypto';
import { withApi, readJson, parseWith } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createOrderRequest } from '@/lib/schemas';
import { repo } from '@/lib/db';
import { createOrder, getPlan } from '@/lib/payments/razorpay';
import { hasRazorpay, razorpay } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Starts a checkout. When Razorpay is not configured, tells the client to use
 * the demo-upgrade route instead — same "labelled fallback" pattern the rest
 * of the app uses for AI and ingestion.
 */
export const POST = withApi(async (request) => {
  const user = await requireUser();
  const { plan: planId } = parseWith(createOrderRequest, await readJson(request));

  if (!hasRazorpay) {
    return { demo: true, plan: planId };
  }

  const plan = getPlan(planId);
  const receipt = `fs_${planId}_${randomUUID().slice(0, 12)}`;
  const order = await createOrder({ planId, receipt, notes: { userId: user.id, email: user.email || '' } });

  await repo.createPaymentOrder({
    id: order.id,
    userId: user.id,
    plan: planId,
    amountPaise: plan.amountPaise,
    currency: plan.currency,
  });

  return {
    demo: false,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpay.keyId,
    plan: planId,
    planLabel: plan.label,
    prefill: { name: user.name || '', email: user.email || '' },
  };
});
