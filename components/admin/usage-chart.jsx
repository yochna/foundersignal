'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Activity, Coins } from 'lucide-react';
import { formatUsd } from '@/lib/utils';

const AXIS = {
  stroke: 'rgb(var(--text-on-surface-variant) / 0.4)',
  fontSize: 10,
  fontWeight: 700,
};

function shortDay(day) {
  const parsed = new Date(day);
  return Number.isNaN(parsed.getTime())
    ? day
    : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function TooltipCard({ active, payload, label, valueFormat }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border border-border px-3 py-2 text-[11px] shadow-lg">
      <p className="font-bold text-on-surface">{shortDay(label)}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-0.5 text-on-surface-variant">
          <span className="font-semibold">{entry.name}: </span>
          <span className="mono">{valueFormat ? valueFormat(entry.value) : entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Calls per day, split by how each one was actually served. */
export function CallsChart({ daily, className }) {
  const hasData = daily.some((d) => d.calls > 0);

  return (
    <Card tone="glass" className={className}>
      <div className="p-5 pb-0">
        <CardEyebrow icon={Activity}>AI calls per day</CardEyebrow>
        <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant/80">
          Stacked by how the answer was served. A tall fallback band means the model was unavailable
          or quota-limited, not that the feature failed.
        </p>
      </div>

      <div className="h-[190px] p-3">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <defs>
                {[
                  ['live', '#10b981'],
                  ['cached', '#6366f1'],
                  ['fallback', '#f59e0b'],
                ].map(([key, color]) => (
                  <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.04} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="rgb(var(--border-color) / 0.5)"
                vertical={false}
              />
              <XAxis dataKey="day" tickFormatter={shortDay} tickLine={false} axisLine={false} {...AXIS} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} {...AXIS} />
              <Tooltip content={<TooltipCard />} />
              {[
                ['live', '#10b981', 'Live model'],
                ['cached', '#6366f1', 'Cached'],
                ['fallback', '#f59e0b', 'Heuristic'],
              ].map(([key, color, name]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={name}
                  stackId="1"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#fill-${key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              No AI calls recorded in this window yet. Use any AI feature and this chart populates from
              the usage table.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Estimated spend per day against the configured budget. */
export function CostChart({ daily, budgetUsd, className }) {
  const hasCost = daily.some((d) => d.cost > 0);

  return (
    <Card tone="glass" className={className}>
      <div className="p-5 pb-0">
        <CardEyebrow icon={Coins}>Estimated AI spend per day</CardEyebrow>
        <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant/80">
          Token-based estimate, not a billing figure. Bars turn amber past the{' '}
          <span className="mono font-bold">{formatUsd(budgetUsd)}</span> daily cap, at which point every
          feature falls back to deterministic scoring.
        </p>
      </div>

      <div className="h-[170px] p-3">
        {hasCost ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="rgb(var(--border-color) / 0.5)"
                vertical={false}
              />
              <XAxis dataKey="day" tickFormatter={shortDay} tickLine={false} axisLine={false} {...AXIS} />
              <YAxis tickLine={false} axisLine={false} width={54} {...AXIS} tickFormatter={formatUsd} />
              <Tooltip content={<TooltipCard valueFormat={formatUsd} />} />
              <Bar dataKey="cost" name="Estimated cost" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {daily.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.cost >= budgetUsd ? '#f59e0b' : 'rgb(var(--color-primary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              No billable model calls yet, so estimated spend is zero.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
