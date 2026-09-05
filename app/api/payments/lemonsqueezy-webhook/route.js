import { NextResponse } from 'next/server';
import { repo } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/payments/lemonsqueezy';
import { getPlan } from '@/lib/payments/plans';

export const dynamic = 'force-dynamic';

/**
 * Configure this URL (https://<your-app>/api/payments/lemonsqueezy-webhook)
 * in Lemon Squeezy under Settings -> Webhooks, subscribed to "order_created",
 * and set LEMONSQUEEZY_WEBHOOK_SECRET to the signing secret shown there.
 *
 * This is the *only* place access actually gets granted — unlike the old
 * Razorpay flow, there's no separate client-side "verify on return" step,
 * since Lemon Squeezy's hosted checkout doesn't append a signed proof to its
 * redirect URL. The client (see subscription-context.jsx) just polls
 * /api/plan for a few seconds after returning from checkout, waiting for
 * this webhook to have already done its job — which is normally near-
 * instant, well within the polling window.
 *
 * Deliberately does not use withApi: webhook callers need a plain 200/4xx,
 * not the app's JSON error envelope.
 */
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') || '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const eventName = event?.meta?.event_name;

  if (eventName === 'order_created') {
    const order = event?.data?.attributes;
    const custom = event?.meta?.custom_data || {};
    const userId = custom.user_id;
    const receipt = custom.receipt;
    const paymentId = event?.data?.id;
    const status = order?.status; // 'paid' | 'pending' | 'refunded' | ...

    if (userId && status === 'paid') {
      try {
        // receipt lets us keep an audit-trail row like the Razorpay flow did,
        // but is optional — userId alone is enough to grant access, since
        // Lemon Squeezy's checkout already round-tripped it for us.
        if (receipt) {
          const existing = await repo.getPaymentOrder(receipt).catch(() => null);
          if (existing && existing.status !== 'captured') {
            await repo.markPaymentCaptured(receipt, paymentId);
          }
        }

        const plan = getPlan('venture_pro');
        if (plan) {
          const expiresAt = new Date(Date.now() + plan.periodDays * 24 * 60 * 60 * 1000).toISOString();
          await repo.setUserPlan(userId, { plan: plan.id, expiresAt });
        }
      } catch (error) {
        console.error('[payments/lemonsqueezy-webhook] failed to grant access:', error.message);
        return NextResponse.json({ ok: false, error: 'internal error' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
