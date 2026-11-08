import type { Fixture, Team } from '@futbol/core'
import { ArrowLeftIcon } from 'lucide-react'
import { ErrorMessage } from '@/components/error-message'
import { FixtureRow } from '@/components/fixture-row'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTeamFixtures } from '@/hooks/use-football-queries'
import { formatLimaDateTime } from '@/lib/format'

const SKELETON_ROWS = 3

interface TeamFixturesProps {
  team: Team
  selectedFixtureId: number | null
  onSelect: (fixture: Fixture) => void
  /** Leaves the team and goes back to the matches of the day. */
  onBack: () => void
}

export function TeamFixtures({ team, selectedFixtureId, onSelect, onBack }: TeamFixturesProps) {
  const { data, isPending, isError, error } = useTeamFixtures(team.team.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Partidos de {team.team.name}
          {data ? ` · temporada ${data.season}` : null}
        </CardTitle>
        <CardDescription>Todas las competiciones. Elige un partido para ver su análisis.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeftIcon />
            Hoy
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : null}
        {isError ? <ErrorMessage title="No se pudieron cargar los partidos" error={error} /> : null}
        {data ? (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Próximos ({data.upcoming.length})</TabsTrigger>
              <TabsTrigger value="played">Jugados ({data.played.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <FixtureList
                fixtures={data.upcoming}
                emptyMessage="No hay partidos pendientes en esta temporada."
                selectedFixtureId={selectedFixtureId}
                onSelect={onSelect}
              />
            </TabsContent>
            <TabsContent value="played">
              <FixtureList
                fixtures={data.played}
                emptyMessage="Todavía no se jugó ningún partido esta temporada."
                selectedFixtureId={selectedFixtureId}
                onSelect={onSelect}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface FixtureListProps {
  fixtures: Fixture[]
  emptyMessage: string
  selectedFixtureId: number | null
  onSelect: (fixture: Fixture) => void
}

function FixtureList({ fixtures, emptyMessage, selectedFixtureId, onSelect }: FixtureListProps) {
  if (fixtures.length === 0) {
    return <p className="py-3 text-sm text-muted-foreground">{emptyMessage}</p>
  }
  return (
    <div className="flex flex-col gap-2 pt-2 xl:max-h-[calc(100svh-17rem)] xl:overflow-y-auto">
      {fixtures.map((fixture) => (
        <FixtureRow
          key={fixture.fixture.id}
          fixture={fixture}
          selected={fixture.fixture.id === selectedFixtureId}
          onSelect={onSelect}
          detail={
            <>
              {fixture.league.name}
              <br />
              {formatLimaDateTime(fixture.fixture.date)}
            </>
          }
        />
      ))}
    </div>
  )
}
