'use client';

import { useEffect, useState } from 'react';

// A handful of blips arranged around the dial, same style as the landing
// page hero radar, just a smaller/denser set to suit the compact splash size.
const BLIPS = [
  { angle: 18, radius: 0.38, color: '#10b981', size: 6 },
  { angle: 72, radius: 0.82, color: '#0ea5e9', size: 5 },
  { angle: 126, radius: 0.55, color: '#f59e0b', size: 6 },
  { angle: 184, radius: 0.9, color: '#f43f5e', size: 5 },
  { angle: 244, radius: 0.46, color: '#10b981', size: 5 },
  { angle: 306, radius: 0.7, color: '#0ea5e9', size: 6 },
];

const SWEEP_PERIOD_SEC = 7;

function radarPosition(angle, radius) {
  const rad = (angle * Math.PI) / 180;
  return {
    left: `${50 + radius * 46 * Math.sin(rad)}%`,
    top: `${50 - radius * 46 * Math.cos(rad)}%`,
  };
}

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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background transition-opacity duration-500 ease-out ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Radar dial — same rings / sweep / scan-line / blips as the landing hero,
          just crisp (no edge mask) and sized to sit as the splash centerpiece. */}
      <div className="relative aspect-square w-40 sm:w-48" role="img" aria-label="FounderSignal">
        <svg className="h-full w-full" viewBox="0 0 200 200" fill="none">
          <circle className="radar-ring" cx="100" cy="100" r="26" strokeWidth="1" />
          <circle className="radar-ring" cx="100" cy="100" r="52" strokeWidth="1" />
          <circle className="radar-ring" cx="100" cy="100" r="78" strokeWidth="1" />
          <circle className="radar-ring-inner" cx="100" cy="100" r="96" strokeWidth="1" />
          <path className="radar-ring" d="M4 100 H196" strokeWidth="1" />
          <path className="radar-ring" d="M100 4 V196" strokeWidth="1" />
          <circle className="radar-ring-inner" cx="100" cy="100" r="1.6" fill="currentColor" stroke="none" />
        </svg>

        <div className="radar-sweep absolute inset-0 rounded-full" />
        <div
          className="radar-scan absolute"
          style={{ left: 'calc(50% - 1px)', top: 0, width: 2, height: '50%' }}
        />

        {BLIPS.map((blip, i) => {
          const { left, top } = radarPosition(blip.angle, blip.radius);
          const delay = -((blip.angle / 360) * SWEEP_PERIOD_SEC);
          return (
            <span
              key={i}
              className="radar-blip"
              style={{
                left,
                top,
                width: blip.size,
                height: blip.size,
                marginLeft: -blip.size / 2,
                marginTop: -blip.size / 2,
                background: blip.color,
                boxShadow: `0 0 10px 2px ${blip.color}55`,
                animationDuration: `${SWEEP_PERIOD_SEC}s`,
                animationDelay: `${delay.toFixed(2)}s`,
              }}
            />
          );
        })}
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
