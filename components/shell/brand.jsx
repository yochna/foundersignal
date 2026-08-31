import { cn } from '@/lib/utils';

/**
 * Concentric-sweep radar mark. Inline SVG rather than an icon-font glyph so it
 * can animate and inherit theme tokens.
 */
export function BrandMark({ className, animated = true }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label="FounderSignal"
    >
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.28" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <path d="M16 16 L16 3 A13 13 0 0 1 27.3 9.5 Z" fill="currentColor" opacity="0.22">
        {animated ? (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 16 16"
            to="360 16 16"
            dur="4.5s"
            repeatCount="indefinite"
          />
        ) : null}
      </path>
      <circle cx="23" cy="11" r="2" fill="currentColor" />
    </svg>
  );
}

export function BrandLockup({ compact = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary p-1.5 text-on-primary">
        <BrandMark />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-black leading-tight tracking-tight text-on-surface">
            Founder<span className="text-primary">Signal</span>
          </span>
          <span className="block truncate text-[9px] font-black uppercase tracking-[0.14em] text-on-surface-variant/80">
            India opportunity radar
          </span>
        </span>
      ) : null}
    </div>
  );
}

export default BrandLockup;
