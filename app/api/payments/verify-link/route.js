import { cookies } from 'next/headers';
import { withApi, readJson, parseWith } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { verifyPaymentLinkRequest } from '@/lib/schemas';
import { repo } from '@/lib/db';
import { verifyPaymentLinkSignature, getPlan } from '@/lib/payments/razorpay';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { PRO_COOKIE, PLAN_COOKIE } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Confirms a Payment Link checkout when the browser redirects back from
 * Razorpay's hosted page (callback_url carries these five query params).
 * This is the fast, primary confirmation path; /api/payments/webhook is the
 * asynchronous backstop in case the browser never makes it back (closed
 * tab, flaky network).
 */
export const POST = withApi(async (request) => {
  const user = await requireUser();
  const { paymentLinkId, referenceId, paymentLinkStatus, paymentId, signature } = parseWith(
    verifyPaymentLinkRequest,
    await readJson(request)
  );

  const valid = verifyPaymentLinkSignature({
    paymentLinkId,
    referenceId,
    paymentLinkStatus,
    paymentId,
    signature,
  });
  if (!valid) throw badRequest('Payment signature could not be verified');
  if (paymentLinkStatus !== 'paid') throw badRequest(`Payment link status is "${paymentLinkStatus}", not paid`);

  const order = await repo.getPaymentOrder(referenceId);
  if (!order) throw notFound('No matching order for this payment');
  if (order.userId !== user.id) throw forbidden('This order belongs to a different account');

  const plan = getPlan(order.plan);
  if (!plan) throw badRequest('Unknown plan on order');

  if (order.status !== 'captured') {
    await repo.markPaymentCaptured(referenceId, paymentId);
  }

  const expiresAt = new Date(Date.now() + plan.periodDays * 24 * 60 * 60 * 1000).toISOString();
  await repo.setUserPlan(user.id, { plan: plan.id, expiresAt });

  const jar = cookies();
  const cookieOptions = { path: '/', maxAge: YEAR_MS / 1000, httpOnly: true, sameSite: 'lax' };
  jar.set(PRO_COOKIE, 'true', cookieOptions);
  jar.set(PLAN_COOKIE, plan.id, cookieOptions);

  return { verified: true, plan: plan.id, expiresAt };
});
