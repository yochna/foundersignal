import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Route guard.
 *
 * Page requests redirect to /login with a callback so the user lands back where
 * they intended. API requests get a JSON 401 in the same envelope every other
 * route uses, so the client never has to special-case an HTML redirect body.
 */

const PROTECTED_PAGES = ['/saved', '/admin', '/chat', '/profile'];

const PROTECTED_API = [
  '/api/opportunities/save',
  '/api/chat',
  '/api/admin',
  '/api/profile',
];

/**
 * Community routes are deliberately absent from both lists. The feed and every
 * thread are readable signed out; posting, replying and voting call
 * requireUser() inside their handlers, so a GET is never redirected to login.
 */

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const isProtectedPage = PROTECTED_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  // The cron entry point authenticates with a bearer secret rather than a
  // session, so it is checked inside the route handler instead.
  if (pathname.startsWith('/api/cron')) return NextResponse.next();

  // Admin ingestion may also be triggered with CRON_SECRET by an external
  // scheduler; let the handler decide so both paths stay supported.
  if (pathname.startsWith('/api/admin/ingest') && request.headers.get('authorization')) {
    return NextResponse.next();
  }

  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'foundersignal-insecure-development-secret-change-me',
    });
  } catch {
    token = null;
  }

  if (token) return NextResponse.next();

  if (isProtectedApi) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          hint: 'Sign in to continue.',
        },
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/saved/:path*',
    '/admin/:path*',
    '/chat/:path*',
    '/profile',
    '/api/opportunities/save',
    '/api/chat/:path*',
    '/api/admin/:path*',
    '/api/profile',
  ],
};
