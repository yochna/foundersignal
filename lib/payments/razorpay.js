import { createHmac, timingSafeEqual } from 'node:crypto';
import { razorpay, hasRazorpay } from '@/lib/config';
import { getPlan } from '@/lib/payments/plans';

export { getPlan } from '@/lib/payments/plans';

/**
 * Razorpay integration.
 *
 * No SDK dependency, deliberately — this is a thin wrapper over the Orders
 * API (https://razorpay.com/docs/api/orders/) using fetch and Basic Auth,
 * the same "hand-written client" approach as lib/ai/gemini.js.
 *
 * Flow:
 *   1. Client asks POST /api/payments/create-order for a plan.
 *   2. Server creates a Razorpay order (amount is decided server-side from
 *      PLANS, never trusted from the client) and returns the order id.
 *   3. Client opens Razorpay Checkout with that order id.
 *   4. Razorpay calls the client-side handler with payment_id + signature.
 *   5. Client posts those to POST /api/payments/verify, which recomputes the
 *      HMAC signature server-side before granting anything.
 *   6. RAZORPAY_WEBHOOK_SECRET (optional) lets /api/payments/webhook confirm
 *      the same payment asynchronously, in case step 5 never lands (closed
 *      tab, flaky network) — see /api/payments/webhook/route.js.
 */

const API_BASE = 'https://api.razorpay.com/v1';

function authHeader() {
  const token = Buffer.from(`${razorpay.keyId}:${razorpay.keySecret}`).toString('base64');
  return `Basic ${token}`;
}

/** Creates a Razorpay order for the given plan. Throws on any non-2xx response. */
export async function createOrder({ planId, receipt, notes }) {
  if (!hasRazorpay) throw new Error('Razorpay is not configured');
  const plan = getPlan(planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: plan.currency,
      receipt,
      notes: { plan: plan.id, ...notes },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.description || `Razorpay order creation failed (${res.status})`);
  }
  return data;
}

/**
 * Creates a Razorpay Payment Link — a hosted checkout page (no client-side
 * checkout.js script or modal needed). The link's `reference_id` is our own
 * order id, since Payment Links don't have a Razorpay order_id until someone
 * actually pays, unlike the Orders API used by createOrder() above.
 */
export async function createPaymentLink({ planId, receipt, notes, prefill, callbackUrl }) {
  if (!hasRazorpay) throw new Error('Razorpay is not configured');
  const plan = getPlan(planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const res = await fetch(`${API_BASE}/payment_links`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: plan.currency,
      reference_id: receipt,
      description: plan.label,
      customer: { name: prefill?.name || undefined, email: prefill?.email || undefined },
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes: { plan: plan.id, ...notes },
      callback_url: callbackUrl,
      callback_method: callbackUrl ? 'get' : undefined,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.description || `Razorpay payment link creation failed (${res.status})`);
  }
  return data;
}

/**
 * Verifies the signature Razorpay appends to the callback_url query string
 * after a payment link is paid:
 * HMAC-SHA256("<payment_link_id>|<reference_id>|<payment_link_status>|<razorpay_payment_id>", key_secret).
 * This is the primary, fast confirmation path when the user's browser
 * returns from checkout; the webhook is the asynchronous backstop.
 */
export function verifyPaymentLinkSignature({ paymentLinkId, referenceId, paymentLinkStatus, paymentId, signature }) {
  if (!hasRazorpay || !paymentLinkId || !referenceId || !paymentLinkStatus || !paymentId || !signature) return false;
  const payload = `${paymentLinkId}|${referenceId}|${paymentLinkStatus}|${paymentId}`;
  const expected = createHmac('sha256', razorpay.keySecret).update(payload).digest('hex');
  return safeEqualHex(expected, signature);
}

/**
 * Verifies the checkout signature Razorpay's client SDK returns after a
 * successful payment: HMAC-SHA256("<order_id>|<payment_id>", key_secret).
 * Constant-time compare so this can't be timed out by an attacker.
 *
 * Kept for reference/backwards compatibility with the legacy Orders-API
 * checkout flow; the active flow now uses createPaymentLink() above.
 */
export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  if (!hasRazorpay || !orderId || !paymentId || !signature) return false;
  const expected = createHmac('sha256', razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

/** Verifies the `X-Razorpay-Signature` header on an incoming webhook payload. */
export function verifyWebhookSignature({ rawBody, signature }) {
  if (!razorpay.webhookSecret || !signature) return false;
  const expected = createHmac('sha256', razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

function safeEqualHex(a, b) {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
