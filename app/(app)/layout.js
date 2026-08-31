import { AppShell } from '@/components/shell/app-shell';
import { getCurrentUser, checkIsAdmin } from '@/lib/auth';
import { repo } from '@/lib/db';

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  const isAdmin = user ? await checkIsAdmin(user.email) : false;

  let savedCount = 0;
  if (user) {
    try {
      savedCount = (await repo.listSaved(user.id)).length;
    } catch (error) {
      console.error('[layout] saved count lookup failed:', error.message);
    }
  }

  return (
    <AppShell user={user} isAdmin={isAdmin} savedCount={savedCount}>
      <div id="main-content">{children}</div>
    </AppShell>
  );
}