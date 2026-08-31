import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESETS = {
  rising: { icon: TrendingUp, className: 'text-emerald-signal bg-emerald-signal/12 border-emerald-signal/25', sign: '+' },
  steady: { icon: Minus, className: 'text-on-surface-variant bg-surface-low border-border', sign: '' },
  declining: { icon: TrendingDown, className: 'text-rose-signal bg-rose-signal/12 border-rose-signal/25', sign: '' },
};

/** Momentum direction plus the signal-volume change over the trailing window. */
export function MomentumPill({ momentum = 'steady', changePercentage = 0, className, showLabel = false }) {
  const preset = PRESETS[momentum] || PRESETS.steady;
  const Icon = preset.icon;
  const magnitude = Math.abs(Number(changePercentage) || 0);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
        preset.className,
        className
      )}
      title={`Signal volume ${momentum}, ${preset.sign}${magnitude}% over the last 90 days`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="mono">
        {preset.sign}
        {magnitude}%
      </span>
      {showLabel ? <span className="uppercase tracking-wider">{momentum}</span> : null}
    </span>
  );
}

export default MomentumPill;
