import { getEntitlement } from '@/lib/entitlements';
import { PaywallCard } from '@/components/opportunity/paywall-card';

/**
 * Server-side content gate for Pro intelligence.
 *
 * This is a server component on purpose: when the requester is not entitled to
 * Pro content, the sensitive children are never rendered and therefore never
 * serialized to the client. Free users receive only the PaywallCard callout, so
 * the paywall cannot be bypassed by inspecting the page source, the RSC
 * payload, or the network response.
 *
 * Entitlement is resolved server-side (session tier first, then the demo
 * upgrade cookies). The client-side subscription context mirrors the same
 * state for UI affordances, but it never controls access.
 */
export async function PaywallGate({
  children,
  isLocked = true,
  title,
  description,
  className,
}) {
  if (!isLocked) {
    return <>{children}</>;
  }

  let isPro = false;
  try {
    isPro = (await getEntitlement()).isPro;
  } catch {
    isPro = false;
  }

  if (isPro) {
    return <>{children}</>;
  }

  return <PaywallCard title={title} description={description} className={className} />;
}

export default PaywallGate;
