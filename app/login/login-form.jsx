'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { InlineError } from '@/components/feedback/error-panel';

/** NextAuth surfaces failures as ?error=CODE; translate the ones users can act on. */
const AUTH_ERRORS = {
  OAuthSignin: 'Could not start the Google sign-in flow.',
  OAuthCallback: 'Google rejected the callback. Check that the redirect URI matches exactly.',
  OAuthAccountNotLinked: 'That email is already linked to a different sign-in method.',
  AccessDenied: 'Access was denied at the consent screen.',
  Configuration: 'Auth is misconfigured on the server.',
  CredentialsSignin: 'Invalid credentials. Please check your email and password.',
  Verification: 'That sign-in link has expired.',
  Default: 'Sign-in failed. Please check your credentials.',
};

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function LoginForm({ callbackUrl = '/radar', hasGoogle, errorCode }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(null);
  const [error, setError] = React.useState(
    errorCode ? { message: AUTH_ERRORS[errorCode] || AUTH_ERRORS.Default } : null
  );
  const [form, setForm] = React.useState({ username: '', password: '' });

  async function handleGoogle() {
    setError(null);
    setPending('google');
    const result = await signIn('google', { callbackUrl, redirect: true });
    if (result?.error) {
      setError({ message: AUTH_ERRORS[result.error] || AUTH_ERRORS.Default });
      setPending(null);
    }
  }

  async function performLogin(username, password) {
    setError(null);
    const cleanUser = (username || form.username).trim();
    const cleanPass = (password || form.password).trim();

    if (!cleanUser) {
      setError({ message: 'Please enter your username or email address.' });
      return;
    }

    setPending('credentials');
    const result = await signIn('credentials', {
      username: cleanUser,
      password: cleanPass,
      redirect: false,
    });

    if (result?.error) {
      setError({ message: AUTH_ERRORS[result.error] || 'Invalid username or password.' });
      setPending(null);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    performLogin(form.username, form.password);
  }

  return (
    <Card tone="strong" className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-black tracking-tight text-on-surface">
          Sign In to FounderSignal
        </h2>
      </div>
      <p className="text-xs leading-relaxed text-on-surface-variant">
        Sign in to access real-time market signals, save opportunities, and manage account tier settings.
      </p>

      {error ? <InlineError error={error} className="mt-4" /> : null}

      {hasGoogle ? (
        <Button
          onClick={handleGoogle}
          loading={pending === 'google'}
          variant="secondary"
          size="lg"
          className="mt-5 w-full"
        >
          {pending !== 'google' ? <GoogleGlyph /> : null}
          Continue with Google
        </Button>
      ) : null}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          or sign in with credentials
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Manual Credentials Form */}
      <form onSubmit={handleFormSubmit} noValidate>
        <div className="space-y-3.5">
          <div>
            <Label htmlFor="login-username">Username or Email</Label>
            <Input
              id="login-username"
              className="mt-1.5"
              required
              placeholder="you@example.com"
              autoComplete="username email"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              className="mt-1.5"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={pending === 'credentials'}
          className="mt-5 w-full font-bold shadow-md shadow-primary/20"
        >
          {pending !== 'credentials' ? <LogIn className="mr-2 h-4 w-4" /> : null}
          Sign In
        </Button>
      </form>
    </Card>
  );
}

export default LoginForm;
