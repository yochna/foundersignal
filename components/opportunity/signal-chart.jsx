'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { scoreBand } from '@/lib/utils';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-[11px]">
      <p className="font-bold text-on-surface">{label}</p>
      <p className="mt-0.5 text-on-surface-variant">
        Signal intensity <span className="mono font-bold text-on-surface">{payload[0].value}</span>
      </p>
    </div>
  );
}

/** Six-month signal intensity trend shown on the detail page. */
export function SignalChart({ data = [], score = 0, height = 220 }) {
  if (data.length < 2) {
    return (
      <p className="py-10 text-center text-xs text-on-surface-variant">
        Not enough history yet to plot a trend. This appears after two or more ingestion runs.
      </p>
    );
  }

  const color = scoreBand(score).hex;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} domain={[0, 100]} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.25}
            fill="url(#signalFill)"
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--bg-background))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SignalChart;
