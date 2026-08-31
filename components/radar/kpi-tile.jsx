import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Compact metric tile for the top row of the bento grid. */
export function KpiTile({ label, value, unit, hint, icon: Icon, accent = 'primary', className }) {
  const accentClass = {
    primary: 'text-primary',
    emerald: 'text-emerald-signal',
    violet: 'text-violet-signal',
    amber: 'text-amber-signal',
    indigo: 'text-indigo-signal',
    neutral: 'text-on-surface',
  }[accent];

  return (
    <Card tone="glass" className={cn('tile-hover p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
        {Icon ? <Icon className={cn('h-4 w-4 shrink-0 opacity-80', accentClass)} aria-hidden="true" /> : null}
      </div>

      <p className="mt-2.5 flex items-baseline gap-1">
        <span className={cn('mono text-[26px] font-bold leading-none', accentClass)}>{value}</span>
        {unit ? (
          <span className="text-[11px] font-bold text-on-surface-variant">{unit}</span>
        ) : null}
      </p>

      {hint ? (
        <p className="mt-1.5 text-[10px] leading-snug text-on-surface-variant/85">{hint}</p>
      ) : null}
    </Card>
  );
}

export default KpiTile;
