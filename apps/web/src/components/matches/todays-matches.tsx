import type { Fixture } from '@futbol/core'
import { ErrorMessage } from '@/components/error-message'
import { FixtureRow } from '@/components/fixture-row'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMatchday } from '@/hooks/use-football-queries'
import { formatLimaDay } from '@/lib/format'
import { matchStatus, sortLiveFirst } from '@/lib/fixture-status'

const SKELETON_ROWS = 4

interface TodaysMatchesProps {
  selectedFixtureId: number | null
  onSelect: (fixture: Fixture) => void
}

export function TodaysMatches({ selectedFixtureId, onSelect }: TodaysMatchesProps) {
  const { data, isPending, isError, error } = useMatchday()
  const withMatches = data?.competitions.filter((competition) => competition.fixtures.length > 0) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partidos de hoy</CardTitle>
        <CardDescription>{data ? `${formatLimaDay(data.date)} · hora de Lima` : 'Cargando…'}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 xl:max-h-[calc(100svh-19rem)] xl:overflow-y-auto">
        {isPending
          ? Array.from({ length: SKELETON_ROWS }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)
          : null}
        {isError ? <ErrorMessage title="No se pudieron cargar los partidos de hoy" error={error} /> : null}
        {data && data.unavailable.length > 0 ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-muted-foreground">
            No se pudieron cargar: {data.unavailable.join(', ')}.
          </p>
        ) : null}
        {data && withMatches.length === 0 && data.unavailable.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hoy no hay partidos en estas competiciones.</p>
        ) : null}
        {withMatches.map((competition) => (
          <section key={competition.id} className="flex flex-col gap-2" aria-label={competition.name}>
            <h3 className="text-sm font-semibold">{competition.name}</h3>
            {sortLiveFirst(competition.fixtures).map((fixture) => (
              <FixtureRow
                key={fixture.fixture.id}
                fixture={fixture}
                selected={fixture.fixture.id === selectedFixtureId}
                onSelect={onSelect}
                detail={<StatusLabel fixture={fixture} />}
              />
            ))}
          </section>
        ))}
      </CardContent>
    </Card>
  )
}

function StatusLabel({ fixture }: { fixture: Fixture }) {
  const { label, live } = matchStatus(fixture)
  return live ? <Badge variant="destructive">{label}</Badge> : <span>{label}</span>
}
