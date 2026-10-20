import type { Fixture } from '@futbol/core'
import { AnalysisWarnings } from '@/components/analysis/analysis-warnings'
import { ComparisonSection } from '@/components/analysis/comparison-section'
import { MatchesTable } from '@/components/analysis/matches-table'
import { MatchHeader } from '@/components/analysis/match-header'
import { ProbabilityCard } from '@/components/analysis/probability-card'
import { ErrorMessage } from '@/components/error-message'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
      <MatchHeader fixture={fixture} />
      {isPending ? <AnalysisSkeleton /> : null}
      {isError ? <ErrorMessage title="No se pudo cargar el análisis" error={error} /> : null}
      {data ? (
        <>
          <AnalysisWarnings
            warnings={data.warnings}
            teamNames={{ [fixture.teams.home.id]: homeName, [fixture.teams.away.id]: awayName }}
          />
          <ProbabilityCard prediction={data.prediction} homeName={homeName} awayName={awayName} />
          <Card>
            <CardContent>
              <Tabs defaultValue="home">
                <TabsList>
                  <TabsTrigger value="home">Últimos 5 — Local</TabsTrigger>
                  <TabsTrigger value="away">Últimos 5 — Visitante</TabsTrigger>
                  <TabsTrigger value="h2h">Cara a cara</TabsTrigger>
                </TabsList>
                <TabsContent value="home">
                  <MatchesTable analysis={data.home} />
                </TabsContent>
                <TabsContent value="away">
                  <MatchesTable analysis={data.away} />
                </TabsContent>
                <TabsContent value="h2h">
                  <MatchesTable analysis={data.headToHead} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <ComparisonSection home={data.home} away={data.away} homeName={homeName} awayName={awayName} />
        </>
      ) : null}
    </section>
  )
}

function AnalysisSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
