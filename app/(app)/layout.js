import { AppShell } from '@/components/shell/app-shell';
import { getCurrentUser, checkIsAdmin } from '@/lib/auth';
import { repo } from '@/lib/db';

/**
 * Shared frame for every in-app route. Resolves the session once here so the
 * rail, topbar and saved badge do not each trigger their own lookup.
 */
export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  const isAdmin = user ? await checkIsAdmin(user.email) : false;

  let savedCount = 0;
  if (user) {
    try {
      savedCount = (await repo.listSaved(user.id)).length;
    } catch (error) {
      // A badge is not worth failing a page render over.
      console.error('[layout] saved count lookup failed:', error.message);
    }
  }

  return (
    <AppShell user={user} isAdmin={isAdmin} savedCount={savedCount}>
      <div id="main-content">{children}</div>
    </AppShell>
  );
}
