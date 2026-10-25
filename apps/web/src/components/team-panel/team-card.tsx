import { AveragesList } from '@/components/team-panel/averages-list'
import { FormSquares } from '@/components/team-panel/form-squares'
import { ErrorMessage } from '@/components/error-message'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamForm } from '@/hooks/use-football-queries'
import { buildFormSquares } from '@/lib/form'

const SKELETON_ROWS = 6

interface TeamCardProps {
  teamId: number
  name: string
  logo: string
  /** Small label above the crest, e.g. "Rival". */
  caption?: string
}

export function TeamCard({ teamId, name, logo, caption }: TeamCardProps) {
  const { data, isPending, isError, error } = useTeamForm(teamId)

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-3 text-center">
          {caption ? <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{caption}</span> : null}
          <img src={logo} alt="" className="size-20 object-contain" />
          <h2 className="font-heading text-lg font-semibold">{name}</h2>
        </div>

        {isPending ? <TeamCardSkeleton /> : null}
        {isError ? <ErrorMessage title="No se pudo cargar la forma del equipo" error={error} /> : null}
        {data ? (
          <>
            <section className="flex flex-col items-center gap-2" aria-label="Últimos 5 resultados">
              <span className="text-xs text-muted-foreground">Últimos 5 resultados</span>
              <FormSquares squares={buildFormSquares(data)} />
            </section>
            <section className="flex w-full flex-col gap-1" aria-label="Promedios">
              <span className="text-xs text-muted-foreground">Promedios (últimos 5 partidos)</span>
              <AveragesList aggregate={data.aggregate} />
            </section>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TeamCardSkeleton() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <Skeleton key={index} className="h-5 w-full" />
      ))}
    </div>
  )
}
