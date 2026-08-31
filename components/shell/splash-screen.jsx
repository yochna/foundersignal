'use client';

import { useEffect, useState } from 'react';

/**
 * Full-screen splash shown for a beat on first load, before the app underneath
 * is visible. Reuses the same radar-sweep motif as the landing page hero, in
 * the active theme's primary color, with the wordmark beneath it.
 */
export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 850);
    const unmountTimer = setTimeout(() => setMounted(false), 1250);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-background transition-opacity duration-500 ease-out ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
        <svg viewBox="0 0 32 32" className="h-12 w-12" role="img" aria-label="FounderSignal">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.28" />
          <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.45" />
          <circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
          <path d="M16 16 L16 3 A13 13 0 0 1 27.3 9.5 Z" fill="currentColor" opacity="0.3">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 16 16"
              to="360 16 16"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </path>
          <circle cx="23" cy="11" r="1.7" fill="currentColor" />
        </svg>
      </div>

      <span
        className="text-lg font-extrabold tracking-tight text-on-surface"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        FounderSignal
      </span>
    </div>
  );
}

export default SplashScreen;
