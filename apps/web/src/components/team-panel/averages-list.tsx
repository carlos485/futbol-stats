import type { TeamAggregate } from '@futbol/core'
import { formatAverage } from '@/lib/format'
import { COMPARISON_METRICS } from '@/lib/metrics'

interface AveragesListProps {
  aggregate: TeamAggregate
}

export function AveragesList({ aggregate }: AveragesListProps) {
  return (
    <dl className="flex w-full flex-col text-sm">
      {COMPARISON_METRICS.map(({ key, label }) => {
        const summary = aggregate.metrics[key]
        return (
          <div key={key} className="flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">
              {formatAverage(summary)} <span className="text-xs font-normal text-muted-foreground">(n={summary.n})</span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
