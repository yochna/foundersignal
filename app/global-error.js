'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary. It replaces the root layout, so it cannot use any of the
 * themed components or CSS variables (globals.css may itself be what failed) and
 * must render its own <html> and <body>. Styles are therefore inline.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[global] unrecoverable render error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070b14',
          color: '#e2ecf5',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#93a9bd',
              margin: 0,
            }}
          >
            FounderSignal
          </p>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.75rem 0 0' }}>
            The application failed to start
          </h1>
          <p style={{ fontSize: '0.8rem', lineHeight: 1.7, color: '#93a9bd', marginTop: '0.75rem' }}>
            Something broke outside every page-level boundary, which usually means a configuration or
            build problem rather than a data problem. Reloading is safe; nothing you saved has been
            lost.
          </p>

          {error?.digest ? (
            <p
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: '0.65rem',
                color: '#6b8199',
                marginTop: '1rem',
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}

          <div
            style={{ marginTop: '1.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                background: '#7dd3fc',
                color: '#04202e',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.6rem 1.1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/radar"
              style={{
                background: 'transparent',
                color: '#e2ecf5',
                border: '1px solid #28374e',
                borderRadius: '0.5rem',
                padding: '0.6rem 1.1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Reload the radar
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
