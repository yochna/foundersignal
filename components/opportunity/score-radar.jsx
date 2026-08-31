'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts';
import { Card, CardEyebrow } from '@/components/ui/card';
import { SCORE_DIMENSIONS } from '@/lib/constants';
import { scoreBand } from '@/lib/utils';

/**
 * Seven-dimension radar of the opportunity score, shown in the sidebar.
 * Recharts renders it client-side; the values are server-fetched and passed in.
 */
export function ScoreRadar({ opportunity = {}, scores, overallScore, className }) {
  const currentScore = opportunity?.score ?? overallScore ?? 0;
  const currentScores = opportunity?.scores ?? scores ?? {};
  const band = scoreBand(currentScore);

  const data = SCORE_DIMENSIONS.map((dimension) => ({
    label: dimension.label.replace(' scarcity', '').replace(' gap', '').replace(' relevance', ''),
    key: dimension.key,
    value: currentScores?.[dimension.key] ?? 0,
  }));

  const Empty = () => (
    <p className="py-8 text-center text-xs text-on-surface-variant">
      No dimension scores available for this opportunity.
    </p>
  );

  if (!data.some((d) => d.value > 0)) {
    return (
      <Card tone="glass" className={className}>
        <div className="p-4">
          <CardEyebrow>Score profile</CardEyebrow>
          <Empty />
        </div>
      </Card>
    );
  }

  return (
    <Card tone="glass" className={className}>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <CardEyebrow>Score profile</CardEyebrow>
          <span className={`text-[10px] font-bold ${band.text}`}>{band.label}</span>
        </div>
        <div className="-mx-2" style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="68%">
              <PolarGrid stroke="rgb(var(--border) / 0.6)" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'rgb(var(--on-surface-variant))' }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Score"
                dataKey="value"
                stroke={band.hex}
                fill={band.hex}
                fillOpacity={0.28}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

export default ScoreRadar;