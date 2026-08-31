import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import {
  adminEmails,
  adminPasswordHash,
  allowDemoLogin,
  google,
  hasAdminPassword,
  hasGoogleAuth,
  hasNextAuthSecret,
  isProd,
  nextAuthSecret,
} from '@/lib/config';
import { repo } from '@/lib/db';
import { forbidden, unauthorized } from '@/lib/errors';

if (isProd && !hasNextAuthSecret) {
  console.warn(
    '[auth] NEXTAUTH_SECRET is not set. A development fallback is in use; set it before any real deployment.'
  );
}

const resolveProvider = (p) => {
  if (typeof p === 'function') return p;
  if (typeof p?.default === 'function') return p.default;
  if (typeof p?.default?.default === 'function') return p.default.default;
  return p;
};

/**
 * Verifies a plaintext password against the "salt:hash" value stored in
 * ADMIN_PASSWORD_HASH (see scripts/hash-admin-password.mjs). Constant-time
 * comparison so a mismatched attempt can't be timed to leak the real hash.
 */
function verifyAdminPassword(rawPassword) {
  if (!hasAdminPassword || !rawPassword) return false;

  const [salt, storedHex] = adminPasswordHash.split(':');
  if (!salt || !storedHex) return false;

  try {
    const stored = Buffer.from(storedHex, 'hex');
    const attempt = scryptSync(rawPassword, salt, stored.length);
    return stored.length === attempt.length && timingSafeEqual(stored, attempt);
  } catch {
    return false;
  }
}

// Direct admin account. Guest/demo accounts were removed; only the primary
// admin plus any ADMIN_EMAILS entries may sign in with credentials.
const PRESET_ACCOUNTS = {
  'mail.jaiswal@gmail.com': {
    id: 'user_admin_mail_jaiswal',
    email: 'mail.jaiswal@gmail.com',
    name: 'Ankur Jaiswal (Admin)',
    plan: 'venture_pro',
    isPro: true,
    isAdmin: true,
    role: 'admin',
  },
};

function buildProviders() {
  const providers = [];
  const Google = resolveProvider(GoogleProvider);
  const Credentials = resolveProvider(CredentialsProvider);

  if (hasGoogleAuth && Google) {
    providers.push(
      Google({
        clientId: google.clientId,
        clientSecret: google.clientSecret,
        issuer: 'https://accounts.google.com',
        authorization: {
          url: 'https://accounts.google.com/o/oauth2/v2/auth',
          params: { prompt: 'select_account', access_type: 'offline', response_type: 'code', scope: 'openid email profile' },
        },
        token: 'https://oauth2.googleapis.com/token',
        userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
      })
    );
  }

  // Credentials / Direct Account Provider (only the configured admin may sign in).
  // Fails closed: with no ADMIN_PASSWORD_HASH set, this provider never
  // registers at all, so there is no path where a blank/misconfigured
  // password silently lets anyone in. Run scripts/hash-admin-password.mjs to
  // set one.
  if (allowDemoLogin && Credentials && hasAdminPassword) {
    providers.push(
      Credentials({
        id: 'credentials',
        name: 'Account credentials',
        credentials: {
          username: { label: 'Username or Email', type: 'text', placeholder: 'you@example.com' },
          password: { label: 'Password', type: 'password', placeholder: '••••••••' },
        },
        async authorize(credentials) {
          const rawLogin = (credentials?.username || credentials?.email || '').trim().toLowerCase();
          const rawPassword = (credentials?.password || '').trim();

          if (!rawLogin || !rawPassword) return null;
          if (!isAdminEmail(rawLogin)) return null;
          if (!verifyAdminPassword(rawPassword)) return null;

          if (rawLogin === 'mail.jaiswal@gmail.com') {
            return PRESET_ACCOUNTS['mail.jaiswal@gmail.com'];
          }

          return {
            id: `admin:${createHash('sha256').update(rawLogin).digest('hex').slice(0, 24)}`,
            email: rawLogin,
            name: rawLogin.split('@')[0],
            image: null,
            plan: 'venture_pro',
            isPro: true,
            isAdmin: true,
            role: 'admin',
          };
        },
      })
    );
  }

  return providers;
}

export const authOptions = {
  providers: buildProviders(),
  secret: nextAuthSecret,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.uid = account?.provider === 'google' ? `google:${user.id}` : user.id;
        token.name = user.name || token.name;
        token.email = user.email || token.email;
        token.picture = user.image || token.picture;
        token.provider = account?.provider || 'credentials';
        
        // Strict role & tier assignment
        const email = (token.email || '').toLowerCase();
        if (isAdminEmail(email)) {
          token.plan = 'venture_pro';
          token.isPro = true;
        } else {
          token.plan = user.plan || 'free';
          token.isPro = user.isPro ?? false;
        }

        // Mirror into user database
        try {
          await repo.upsertUser({
            id: token.uid,
            email: token.email,
            name: token.name,
            image: token.picture,
          });
        } catch (error) {
          console.error('[auth] could not persist user record:', error.message);
        }
      }
      return token;
    },

    async session({ session, token }) {
      const email = (token.email || '').toLowerCase();
      const isMailAdmin = isAdminEmail(email);
      const isProUser = isMailAdmin || Boolean(token.isPro);
      const plan = isProUser ? 'venture_pro' : (token.plan || 'free');

      session.user = {
        id: token.uid || token.sub,
        name: token.name || null,
        email: token.email || null,
        image: token.picture || null,
        provider: token.provider || null,
        plan,
        isPro: isProUser,
      };
      session.isAdmin = isMailAdmin;
      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      console.log(`[auth] sign-in via ${account?.provider || 'credentials'}: ${user?.email || 'no email'}`);
    },
  },

  debug: false,
};

/**
 * Admin check. mail.jaiswal@gmail.com is always verified as primary admin.
 */
export function isAdminEmail(email) {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  if (normalised === 'mail.jaiswal@gmail.com') return true;
  if (adminEmails.length === 0) return true;
  return adminEmails.includes(normalised);
}

export async function checkIsAdmin(email) {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  if (normalised === 'mail.jaiswal@gmail.com') return true;

  try {
    const revoked =
      typeof repo?.getRevokedAdminEmails === 'function'
        ? await repo.getRevokedAdminEmails().catch(() => [])
        : [];
    if (revoked && revoked.includes(normalised)) return false;
  } catch {}

  if (adminEmails.includes(normalised)) return true;

  try {
    const dbAdmins =
      typeof repo?.getAdminEmails === 'function'
        ? await repo.getAdminEmails().catch(() => [])
        : [];
    if (dbAdmins && dbAdmins.some((a) => a.email === normalised)) return true;
  } catch {}

  return adminEmails.includes(normalised);
}

export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('[auth] session lookup failed:', error.message);
    return null;
  }
}

/** Current user or null. Never throws. */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user?.id ? session.user : null;
}

/** Throws UNAUTHORIZED when there is no session. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw unauthorized('Sign in to use this feature');
  return user;
}

/** Throws UNAUTHORIZED or FORBIDDEN as appropriate. */
export async function requireAdmin() {
  const user = await requireUser();
  const allowed = await checkIsAdmin(user.email);
  if (!allowed) {
    throw forbidden('This dashboard is restricted to configured admin accounts');
  }
  return user;
}

/** Auth mode reported by /api/health. */
export function authMode() {
  if (hasGoogleAuth && allowDemoLogin) return 'google+credentials';
  if (hasGoogleAuth) return 'google';
  return 'credentials';
}
