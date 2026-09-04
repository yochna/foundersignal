import { NextResponse } from 'next/server';
import { repo } from '@/lib/db';
import { verifyWebhookSignature, getPlan } from '@/lib/payments/razorpay';

export const dynamic = 'force-dynamic';

/**
 * Optional but recommended: configure this URL (https://<your-app>/api/payments/webhook)
 * in the Razorpay dashboard under Settings -> Webhooks, subscribed to
 * "payment.captured", and set RAZORPAY_WEBHOOK_SECRET to the secret shown
 * there. Without it, a closed tab or flaky network right after payment can
 * leave an order captured on Razorpay's side but never verified on ours;
 * this route is the backstop that catches that case asynchronously.
 *
 * Deliberately does not use withApi: webhook callers need a plain 200/4xx,
 * not the app's JSON error envelope.
 */
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  if (!verifyWebhookSignature({ rawBody, signature })) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  if (event?.event === 'payment.captured') {
    const payment = event?.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    if (orderId && paymentId) {
      try {
        const order = await repo.getPaymentOrder(orderId);
        if (order && order.status !== 'captured') {
          await repo.markPaymentCaptured(orderId, paymentId);
          const plan = getPlan(order.plan);
          if (plan && order.userId) {
            const expiresAt = new Date(Date.now() + plan.periodDays * 24 * 60 * 60 * 1000).toISOString();
            await repo.setUserPlan(order.userId, { plan: plan.id, expiresAt });
          }
        }
      } catch (error) {
        console.error('[payments/webhook] failed to reconcile order:', error.message);
      }
    }
  }

  // Active checkout flow: Payment Links don't have a Razorpay order_id until
  // paid, so these are matched by reference_id — the same id we generate and
  // store as the order's row id at checkout time (see create-order/route.js).
  if (event?.event === 'payment_link.paid') {
    const referenceId = event?.payload?.payment_link?.entity?.reference_id;
    const paymentId = event?.payload?.payment?.entity?.id;
    if (referenceId && paymentId) {
      try {
        const order = await repo.getPaymentOrder(referenceId);
        if (order && order.status !== 'captured') {
          await repo.markPaymentCaptured(referenceId, paymentId);
          const plan = getPlan(order.plan);
          if (plan && order.userId) {
            const expiresAt = new Date(Date.now() + plan.periodDays * 24 * 60 * 60 * 1000).toISOString();
            await repo.setUserPlan(order.userId, { plan: plan.id, expiresAt });
          }
        }
      } catch (error) {
        console.error('[payments/webhook] failed to reconcile payment link:', error.message);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
