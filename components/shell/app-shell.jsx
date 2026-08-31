import { SideRail } from '@/components/shell/side-rail';
import { MobileNav } from '@/components/shell/mobile-nav';
import { Topbar } from '@/components/shell/topbar';
import { StatusBanner } from '@/components/shell/status-banner';

/**
 * Frame for every authenticated-or-not app page: fixed desktop rail, sticky
 * topbar, mobile tab bar, and the degradation banner.
 */
export function AppShell({ user, isAdmin, savedCount, children }) {
  return (
    <div className="min-h-screen">
      <SideRail isAuthed={Boolean(user)} isAdmin={isAdmin} savedCount={savedCount} />

      <div className="flex min-h-screen flex-col md:pl-[4.5rem]">
        <Topbar user={user} isAdmin={isAdmin} />

        <main className="flex-1 pb-24 md:pb-10">
          <div className="mx-auto max-w-[100rem] px-4 py-7 sm:px-6">
            <StatusBanner />
            {children}
          </div>
        </main>

        <footer className="hidden border-t border-border/60 py-6 md:block">
          <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-2 px-6 text-[11px] text-on-surface-variant">
            <p>FounderSignal. Opportunity intelligence for Indian founders and builders.</p>
            <p className="opacity-75">
              Signals are evidence, not advice. Validate independently before committing capital.
            </p>
          </div>
        </footer>
      </div>

      <MobileNav savedCount={savedCount} />
    </div>
  );
}

export default AppShell;
