/**
 * Single source of truth for pricing — provider-neutral, since both
 * lib/payments/razorpay.js and lib/payments/lemonsqueezy.js need the same
 * plan metadata and must never disagree on the price.
 *
 * amountPaise is only meaningful to Razorpay (which prices in paise);
 * Lemon Squeezy's variant price is set in its own dashboard and is the
 * actual source of truth for what a Lemon Squeezy checkout charges — this
 * amountPaise value is used for display copy and the Razorpay code path.
 *
 * periodDays is set to ~100 years so the existing expiresAt plumbing
 * (shared with the old subscription plans) never actually expires a
 * lifetime unlock.
 */
export const PLANS = {
  venture_pro: {
    id: 'venture_pro',
    label: 'Full Report Access',
    amountPaise: 19_900,
    currency: 'INR',
    periodDays: 36_500,
  },
};

export function getPlan(planId) {
  return PLANS[planId] || null;
}
