import type { Team } from '@futbol/core'
import { ErrorMessage } from '@/components/error-message'
import { AveragesList } from '@/components/team-panel/averages-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamForm } from '@/hooks/use-football-queries'

const SKELETON_ROWS = 6

interface StatsCardProps {
  team: Team
}

export function StatsCard({ team }: StatsCardProps) {
  const { data, isPending, isError, error } = useTeamForm(team.team.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas</CardTitle>
        <CardDescription>Promedios de los últimos 5 partidos.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>
        ) : null}
        {isError ? <ErrorMessage title="No se pudieron cargar las estadísticas" error={error} /> : null}
        {data ? <AveragesList aggregate={data.aggregate} /> : null}
      </CardContent>
    </Card>
  )
}
