import type { Team } from '@futbol/core'
import { SearchIcon } from 'lucide-react'
import { TeamCard } from '@/components/team-panel/team-card'
import { TeamSearch } from '@/components/team-search'

export interface RivalTeam {
  id: number
  name: string
  logo: string
}

interface TeamPanelProps {
  team: Team | null
  /** The opponent of the match being analysed, shown under the searched team. */
  rival: RivalTeam | null
  onSelectTeam: (team: Team) => void
}

export function TeamPanel({ team, rival, onSelectTeam }: TeamPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <TeamSearch selected={team} onSelect={onSelectTeam} />
      {team ? (
        <>
          <TeamCard key={team.team.id} teamId={team.team.id} name={team.team.name} logo={team.team.logo} />
          {rival ? <TeamCard key={rival.id} teamId={rival.id} name={rival.name} logo={rival.logo} caption="Rival" /> : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <SearchIcon className="size-6" />
          <p>Busca un equipo y selecciónalo para ver sus detalles.</p>
        </div>
      )}
    </div>
  )
}
