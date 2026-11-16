import type { Fixture } from '@futbol/core'
import { AnalysisWarnings } from '@/components/analysis/analysis-warnings'
import { MatchDetailsCard } from '@/components/analysis/match-details-card'
import { MatchHeader } from '@/components/analysis/match-header'
import { ProbabilitySection } from '@/components/analysis/probability-section'
import { ErrorMessage } from '@/components/error-message'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalysis } from '@/hooks/use-football-queries'

interface AnalysisViewProps {
  fixture: Fixture
}

export function AnalysisView({ fixture }: AnalysisViewProps) {
  const { data, isPending, isError, error } = useAnalysis({
    homeTeamId: fixture.teams.home.id,
    awayTeamId: fixture.teams.away.id,
    kickoff: fixture.fixture.date,
  })

  const homeName = fixture.teams.home.name
  const awayName = fixture.teams.away.name

  return (
    <section className="flex flex-col gap-4" aria-label="Análisis del partido">
      <MatchHeader fixture={fixture}>
        {isPending ? <Skeleton className="h-28 w-full" /> : null}
        {data ? <ProbabilitySection prediction={data.prediction} colors={data.colors} homeName={homeName} awayName={awayName} /> : null}
      </MatchHeader>
      {isPending ? <Skeleton className="h-64 w-full" /> : null}
      {isError ? <ErrorMessage title="No se pudo cargar el análisis" error={error} /> : null}
      {data ? (
        <>
          <AnalysisWarnings
            warnings={data.warnings}
            teamNames={{ [fixture.teams.home.id]: homeName, [fixture.teams.away.id]: awayName }}
          />
          <MatchDetailsCard fixture={fixture} analysis={data} homeName={homeName} awayName={awayName} />
        </>
      ) : null}
    </section>
  )
}
