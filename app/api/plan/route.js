import { NextResponse } from 'next/server';
import { getEntitlement } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entitlement = await getEntitlement();
  return NextResponse.json({ ok: true, ...entitlement }, { headers: { 'Cache-Control': 'no-store' } });
}
