import type { Team } from '@futbol/core'
import { ErrorMessage } from '@/components/error-message'
import { FormSquares } from '@/components/team-panel/form-squares'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamForm } from '@/hooks/use-football-queries'
import { buildFormSquares, findBestAndWorst, type ResultHighlight } from '@/lib/form'

interface ClubHeaderProps {
  team: Team
}

export function ClubHeader({ team }: ClubHeaderProps) {
  const { data, isPending, isError, error } = useTeamForm(team.team.id)
  const highlights = data ? findBestAndWorst(data) : null

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <div className="flex items-center gap-4">
          <img src={team.team.logo} alt="" className="size-20 shrink-0 object-contain" />
          <h2 className="font-heading text-2xl font-semibold">{team.team.name}</h2>
        </div>

        {isPending ? <Skeleton className="h-16 w-72" /> : null}
        {isError ? <ErrorMessage title="No se pudo cargar la forma del equipo" error={error} /> : null}
        {data ? (
          <>
            <section className="flex flex-col gap-2" aria-label="Últimos 5 resultados">
              <span className="text-xs text-muted-foreground">Últimos 5 resultados</span>
              <FormSquares squares={buildFormSquares(data)} />
            </section>
            {highlights ? (
              <section className="flex flex-col gap-1 text-sm" aria-label="Mejor y peor resultado">
                <Highlight label="Mejor resultado" highlight={highlights.best} />
                {highlights.worst ? <Highlight label="Peor resultado" highlight={highlights.worst} /> : null}
              </section>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Highlight({ label, highlight }: { label: string; highlight: ResultHighlight }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}: </span>
      <strong className="tabular-nums">{highlight.score}</strong> {highlight.venue} {highlight.opponent}
    </p>
  )
}
