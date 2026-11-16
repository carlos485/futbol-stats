import type { AnalysisResponse } from '@futbol/core'
import { formatShare } from '@/lib/format'
import { pickSideColors } from '@/lib/team-colors'

const DRAW_COLOR = 'var(--chart-3)'

const PERCENT_FACTOR = 100
const EXPECTED_GOALS_DECIMALS = 2

interface ProbabilitySectionProps {
  prediction: AnalysisResponse['prediction']
  colors: AnalysisResponse['colors']
  homeName: string
  awayName: string
}

/** Win probabilities of the match, drawn inside the match header card. */
export function ProbabilitySection({ prediction, colors, homeName, awayName }: ProbabilitySectionProps) {
  const sideColors = pickSideColors(colors.home, colors.away)
  return (
    <section className="flex w-full flex-col gap-4 border-t pt-4" aria-label="Probabilidades">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">Probabilidades</h3>
        <p className="text-xs text-muted-foreground">Modelo de Poisson sobre los últimos 5 partidos y el historial directo.</p>
      </div>
        {prediction ? (
          <>
            <OutcomeBar
              outcomes={[
                { label: homeName, share: prediction.teamAWin, color: sideColors.home },
                { label: 'Empate', share: prediction.draw, color: DRAW_COLOR },
                { label: awayName, share: prediction.teamBWin, color: sideColors.away },
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
    </section>
  )
}

interface Outcome {
  label: string
  share: number
  /** Any CSS color: a hex value or a theme variable. */
  color: string
}

function OutcomeBar({ outcomes }: { outcomes: Outcome[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {outcomes.map((outcome) => (
          <div
            key={outcome.label}
            style={{ width: `${outcome.share * PERCENT_FACTOR}%`, backgroundColor: outcome.color }}
          />
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {outcomes.map((outcome) => (
          <div key={outcome.label}>
            <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: outcome.color }} />
              {outcome.label}
            </dt>
            <dd className="text-lg font-semibold">{formatShare(outcome.share)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
