import { cookies } from 'next/headers';
import { withApi, readJson, parseWith } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { verifyPaymentRequest } from '@/lib/schemas';
import { repo } from '@/lib/db';
import { verifyCheckoutSignature, getPlan } from '@/lib/payments/razorpay';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { PRO_COOKIE, PLAN_COOKIE } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const POST = withApi(async (request) => {
  const user = await requireUser();
  const { orderId, paymentId, signature } = parseWith(verifyPaymentRequest, await readJson(request));

  const valid = verifyCheckoutSignature({ orderId, paymentId, signature });
  if (!valid) throw badRequest('Payment signature could not be verified');

  const order = await repo.getPaymentOrder(orderId);
  if (!order) throw notFound('No matching order for this payment');
  if (order.userId !== user.id) throw forbidden('This order belongs to a different account');

  const plan = getPlan(order.plan);
  if (!plan) throw badRequest('Unknown plan on order');

  await repo.markPaymentCaptured(orderId, paymentId);

  const expiresAt = new Date(Date.now() + plan.periodDays * 24 * 60 * 60 * 1000).toISOString();
  await repo.setUserPlan(user.id, { plan: plan.id, expiresAt });

  // httpOnly so it can only ever be set here, after a verified payment — never
  // by client JS, unlike the old demo-only flow this replaces.
  const jar = cookies();
  const cookieOptions = { path: '/', maxAge: YEAR_MS / 1000, httpOnly: true, sameSite: 'lax' };
  jar.set(PRO_COOKIE, 'true', cookieOptions);
  jar.set(PLAN_COOKIE, plan.id, cookieOptions);

  return { verified: true, plan: plan.id, expiresAt };
});
