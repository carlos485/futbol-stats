import type { Fixture, Team } from '@futbol/core'
import { ErrorMessage } from '@/components/error-message'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTeamFixtures } from '@/hooks/use-football-queries'
import { formatLimaDateTime, formatScore } from '@/lib/format'

const SKELETON_ROWS = 3

interface TeamFixturesProps {
  team: Team
  selectedFixtureId: number | null
  onSelect: (fixture: Fixture) => void
}

export function TeamFixtures({ team, selectedFixtureId, onSelect }: TeamFixturesProps) {
  const { data, isPending, isError, error } = useTeamFixtures(team.team.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Partidos de {team.team.name}
          {data ? ` · temporada ${data.season}` : null}
        </CardTitle>
        <CardDescription>
          Todas las competiciones. Elige un partido: se analiza con los 5 partidos previos de cada equipo y su historial directo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
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
    <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pt-2">
      {fixtures.map((fixture) => {
        const hasScore = fixture.goals.home !== null && fixture.goals.away !== null
        return (
          <button
            key={fixture.fixture.id}
            type="button"
            onClick={() => onSelect(fixture)}
            aria-pressed={fixture.fixture.id === selectedFixtureId}
            className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted"
          >
            <img src={fixture.teams.home.logo} alt="" className="size-7 object-contain" />
            <span className="font-medium">
              {fixture.teams.home.name} {hasScore ? formatScore(fixture.goals.home, fixture.goals.away) : 'vs'}{' '}
              {fixture.teams.away.name}
            </span>
            <img src={fixture.teams.away.logo} alt="" className="size-7 object-contain" />
            <span className="ml-auto text-right text-xs text-muted-foreground">
              {fixture.league.name}
              <br />
              {formatLimaDateTime(fixture.fixture.date)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
