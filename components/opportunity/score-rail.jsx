import { Card, CardEyebrow } from '@/components/ui/card';
import { RadialGauge, Meter } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MomentumPill } from '@/components/opportunity/momentum-pill';
import { SCORE_DIMENSIONS } from '@/lib/constants';
import { scoreBand, formatDate } from '@/lib/utils';

/**
 * Persistent score panel on the detail page. Sticky on desktop so the numbers
 * stay visible while reading the long-form sections.
 */
export function ScoreRail({ opportunity = {}, scores, overallScore, className }) {
  const currentScore = opportunity?.score ?? overallScore ?? 0;
  const currentScores = opportunity?.scores ?? scores ?? {};
  const band = scoreBand(currentScore);

  return (
    <Card tone="glass" className={className}>
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardEyebrow>Signal score</CardEyebrow>
            <p className={`mt-1 text-xs font-bold ${band.text}`}>{band.label}</p>
          </div>
          <RadialGauge value={currentScore} color={band.hex} size={68} stroke={5} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {opportunity?.vertical ? (
            <Badge variant="outline">{opportunity.vertical}</Badge>
          ) : null}
          {opportunity?.momentum ? (
            <MomentumPill
              momentum={opportunity.momentum}
              changePercentage={opportunity.changePercentage}
              showLabel
            />
          ) : null}
        </div>

        <div className="mt-5 space-y-3.5">
          {SCORE_DIMENSIONS.map((dimension) => {
            const value = currentScores?.[dimension.key] ?? 0;
            return (
              <Meter
                key={dimension.key}
                label={dimension.label}
                value={value}
                color={scoreBand(value).hex}
              />
            );
          })}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Signals
            </dt>
            <dd className="mono mt-0.5 text-base font-bold text-on-surface">
              {opportunity?.signalCount ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Sources
            </dt>
            <dd className="mono mt-0.5 text-base font-bold text-on-surface">
              {opportunity?.sourceCount ?? 0}
            </dd>
          </div>
          {opportunity?.lastUpdated ? (
            <div className="col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Last updated
              </dt>
              <dd className="mt-0.5 text-xs font-semibold text-on-surface">
                {formatDate(opportunity.lastUpdated)}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Card>
  );
}

export default ScoreRail;
