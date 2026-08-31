import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/app/login/login-form';
import { BrandMark } from '@/components/shell/brand';
import { hasGoogleAuth } from '@/lib/config';
import { getCurrentUser } from '@/lib/auth';
import { NAV_ITEMS } from '@/lib/nav';

// Reads the session to redirect an already-signed-in visitor.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to save opportunities, run AI analyses and access the admin dashboard.',
};

export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();
  const callbackUrl =
    typeof searchParams?.callbackUrl === 'string' && searchParams.callbackUrl.startsWith('/')
      ? searchParams.callbackUrl
      : '/radar';

  if (user) redirect(callbackUrl);

  const highlights = NAV_ITEMS.filter((item) =>
    ['/radar', '/idea-validator', '/career-signal', '/saved'].includes(item.href)
  );

  return (
    <main id="main-content" className="relative min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* Pitch column */}
        <div className="order-2 lg:order-1">
          <Link
            href="/radar"
            className="mb-8 inline-flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Browse the radar without signing in
          </Link>

          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary p-2.5 text-on-primary">
              <BrandMark />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight text-on-surface">
                Founder<span className="text-primary">Signal</span>
              </span>
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                India opportunity radar
              </span>
            </span>
          </div>

          <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-on-surface sm:text-[40px]">
            Stop guessing which idea
            <br />
            <span className="text-gradient">the market is asking for.</span>
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-relaxed text-on-surface-variant">
            FounderSignal reads hiring posts, regulatory circulars, developer forums and open-source
            activity, clusters them into themes, and turns each cluster into a scored opportunity brief
            with the evidence attached. Built for the Indian market, where an RBI circular can create a
            category overnight.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href} className="glass flex items-start gap-3 rounded-xl p-3.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-on-surface">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-on-surface-variant">
                      {item.description}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Auth column */}
        <div className="order-1 lg:order-2">
          <LoginForm
            callbackUrl={callbackUrl}
            hasGoogle={hasGoogleAuth}
            errorCode={typeof searchParams?.error === 'string' ? searchParams.error : null}
          />
        </div>
      </div>
    </main>
  );
}
