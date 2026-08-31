'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  LabelList,
} from 'recharts';
import { Card, CardEyebrow } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';
import { scoreBand } from '@/lib/utils';

/** Coloured by average score so a tall-but-weak sector reads differently. */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-[11px]">
      <p className="font-bold text-on-surface">{row.vertical}</p>
      <p className="mt-0.5 text-on-surface-variant">
        <span className="mono font-bold">{row.count}</span> opportunit{row.count === 1 ? 'y' : 'ies'}
      </p>
      <p className="text-on-surface-variant">
        avg score <span className="mono font-bold">{row.avgScore}</span>
      </p>
    </div>
  );
}

export function SectorChart({ verticals = [], className }) {
  if (verticals.length === 0) {
    return (
      <Card tone="glass" className={className}>
        <div className="p-5">
          <CardEyebrow icon={PieIcon}>Sector distribution</CardEyebrow>
          <p className="mt-6 text-center text-xs text-on-surface-variant">
            No sector data yet. Run an ingestion pass to populate the feed.
          </p>
        </div>
      </Card>
    );
  }

  const data = verticals.slice(0, 6);
  const height = Math.max(140, data.length * 34);

  return (
    <Card tone="glass" className={className}>
      <div className="p-5">
        <CardEyebrow icon={PieIcon}>Sector distribution</CardEyebrow>
        <p className="mt-1 text-[10px] text-on-surface-variant/80">
          Bar length is opportunity count; colour is the sector average score.
        </p>

        <div className="mt-4" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="vertical"
                width={78}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--bg-surface-low))' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {data.map((row) => (
                  <Cell key={row.vertical} fill={scoreBand(row.avgScore).hex} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  className="mono"
                  style={{ fill: 'rgb(var(--text-on-surface-variant))', fontSize: 10, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

export default SectorChart;
