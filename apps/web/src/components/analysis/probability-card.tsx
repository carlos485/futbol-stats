import type { AnalysisResponse } from '@futbol/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatShare } from '@/lib/format'

const PERCENT_FACTOR = 100
const EXPECTED_GOALS_DECIMALS = 2

interface ProbabilityCardProps {
  prediction: AnalysisResponse['prediction']
  homeName: string
  awayName: string
}

export function ProbabilityCard({ prediction, homeName, awayName }: ProbabilityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Probabilidades</CardTitle>
        <CardDescription>Modelo de Poisson sobre los últimos 5 partidos y el historial directo.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {prediction ? (
          <>
            <OutcomeBar
              outcomes={[
                { label: homeName, share: prediction.teamAWin, colorClass: 'bg-chart-1' },
                { label: 'Empate', share: prediction.draw, colorClass: 'bg-chart-3' },
                { label: awayName, share: prediction.teamBWin, colorClass: 'bg-chart-2' },
              ]}
            />
            <p className="text-sm">
              Marcador más probable:{' '}
              <strong>
                {prediction.mostLikelyScore.teamA} - {prediction.mostLikelyScore.teamB}
              </strong>{' '}
              ({formatShare(prediction.mostLikelyScore.probability)}) · Más de 2.5 goles:{' '}
              <strong>{formatShare(prediction.overTwoPointFive)}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Goles esperados: {homeName} {prediction.expectedGoalsA.toFixed(EXPECTED_GOALS_DECIMALS)} · {awayName}{' '}
              {prediction.expectedGoalsB.toFixed(EXPECTED_GOALS_DECIMALS)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No hay datos suficientes para calcular probabilidades.</p>
        )}
      </CardContent>
    </Card>
  )
}

interface Outcome {
  label: string
  share: number
  colorClass: string
}

function OutcomeBar({ outcomes }: { outcomes: Outcome[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {outcomes.map((outcome) => (
          <div
            key={outcome.label}
            className={outcome.colorClass}
            style={{ width: `${outcome.share * PERCENT_FACTOR}%` }}
          />
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {outcomes.map((outcome) => (
          <div key={outcome.label}>
            <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2 rounded-full ${outcome.colorClass}`} />
              {outcome.label}
            </dt>
            <dd className="text-lg font-semibold">{formatShare(outcome.share)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
