'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Users } from 'lucide-react';

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

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border border-border px-3 py-2 text-[11px] shadow-lg">
      <p className="font-bold text-on-surface">{shortDay(label)}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-0.5 text-on-surface-variant">
          <span className="font-semibold">{entry.name}: </span>
          <span className="mono">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Daily pageviews and visitors, sourced live from the Vercel Web Analytics API. */
export function VisitorsChart({ daily, className }) {
  const hasData = (daily || []).some((d) => d.pageviews > 0);

  return (
    <Card tone="glass" className={className}>
      <div className="p-5 pb-0">
        <CardEyebrow icon={Users}>Visitors per day</CardEyebrow>
        <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant/80">
          Live from Vercel Web Analytics — pageviews and unique visitors across the whole site.
        </p>
      </div>

      <div className="h-[190px] p-3">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <defs>
                {[
                  ['pageviews', '#6366f1'],
                  ['visitors', '#10b981'],
                ].map(([key, color]) => (
                  <linearGradient key={key} id={`fill-visit-${key}`} x1="0" y1="0" x2="0" y2="1">
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
                ['pageviews', '#6366f1', 'Pageviews'],
                ['visitors', '#10b981', 'Visitors'],
              ].map(([key, color, name]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={name}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#fill-visit-${key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              No traffic recorded by Vercel Web Analytics in this window yet.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default VisitorsChart;
