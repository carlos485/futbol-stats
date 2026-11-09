import type { Team } from '@futbol/core'
import { SearchIcon } from 'lucide-react'
import { TeamCard } from '@/components/team-panel/team-card'

interface TeamPanelProps {
  /** The team picked in the search box, if any. */
  team: Team | null
}

export function TeamPanel({ team }: TeamPanelProps) {
  if (!team) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        <SearchIcon className="size-6" />
        <p>Busca un equipo y selecciónalo para ver sus detalles.</p>
      </div>
    )
  }
  return <TeamCard key={team.team.id} teamId={team.team.id} name={team.team.name} logo={team.team.logo} />
}
