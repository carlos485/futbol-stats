import type { Team } from '@futbol/core'
import { ErrorMessage } from '@/components/error-message'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamStanding } from '@/hooks/use-football-queries'

interface StandingCardProps {
  team: Team
}

/** The team's place in the table of its league. Hidden when the competition has no table. */
export function StandingCard({ team }: StandingCardProps) {
  const { data, isPending, isError, error } = useTeamStanding(team.team.id, team.league.id)

  if (isError) return <ErrorMessage title="No se pudo cargar la posición" error={error} />
  if (isPending) return <Skeleton className="h-40 w-full" />
  if (!data) return null

  const rows = [
    { label: 'Puntos', value: data.points },
    { label: 'Partidos jugados', value: data.played },
    { label: 'Ganados / empatados / perdidos', value: `${data.wins} / ${data.draws} / ${data.losses}` },
    { label: 'Goles a favor / en contra', value: `${data.goalsFor} / ${data.goalsAgainst}` },
    { label: 'Diferencia de goles', value: data.goalDifference > 0 ? `+${data.goalDifference}` : data.goalDifference },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posición</CardTitle>
        <CardDescription>{data.group ? `${data.competitionName} · ${data.group}` : data.competitionName}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="font-heading text-4xl font-semibold tabular-nums">{data.rank}.º</p>
        <dl className="flex flex-col text-sm">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
