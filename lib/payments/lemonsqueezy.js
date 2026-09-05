import { createHmac, timingSafeEqual } from 'node:crypto';
import { lemonsqueezy, hasLemonsqueezy } from '@/lib/config';

const API_BASE = 'https://api.lemonsqueezy.com/v1';

/**
 * Constant-time hex comparison, same pattern used for the Razorpay
 * signatures elsewhere in lib/payments — avoids timing side-channels on a
 * security check, and avoids throwing on mismatched-length input (a raw
 * !== compare on attacker-controlled strings should never assume equal
 * length).
 */
function safeEqualHex(a, b) {
  const bufA = Buffer.from(String(a), 'hex');
  const bufB = Buffer.from(String(b), 'hex');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Creates a Lemon Squeezy hosted checkout for the single one-time-purchase
 * variant. `custom.user_id` rides along in the checkout session and comes
 * back verbatim in the `order_created` webhook's `meta.custom_data`, which
 * is how the webhook knows which account to unlock — no pre-created order
 * row to look up, unlike the Razorpay Payment Links flow.
 */
export async function createCheckout({ user, redirectUrl, receipt }) {
  if (!hasLemonsqueezy) throw new Error('Lemon Squeezy is not configured');

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${lemonsqueezy.apiKey}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: user.email || undefined,
            name: user.name || undefined,
            custom: { user_id: user.id, receipt },
          },
          product_options: {
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(lemonsqueezy.storeId) } },
          variant: { data: { type: 'variants', id: String(lemonsqueezy.variantId) } },
        },
      },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.errors?.[0]?.detail || `Lemon Squeezy checkout creation failed (${res.status})`;
    throw new Error(message);
  }

  const url = data?.data?.attributes?.url;
  if (!url) throw new Error('Lemon Squeezy did not return a checkout URL');
  return { url, id: data.data.id };
}

/**
 * Verifies the X-Signature header Lemon Squeezy sends on every webhook
 * request: HMAC-SHA256 of the *raw* request body (before JSON.parse), hex
 * digest, using the webhook's signing secret. Must be called with the raw
 * body string — re-serializing a parsed object will not reproduce the same
 * bytes and will always fail verification.
 */
export function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!hasLemonsqueezy || !lemonsqueezy.webhookSecret || !rawBody || !signatureHeader) return false;
  const expected = createHmac('sha256', lemonsqueezy.webhookSecret).update(rawBody, 'utf8').digest('hex');
  return safeEqualHex(expected, signatureHeader);
}
