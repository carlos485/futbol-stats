import { SearchIcon } from 'lucide-react'
import { TeamCard } from '@/components/team-panel/team-card'
import type { PanelTeam } from '@/lib/panel-teams'

interface TeamPanelProps {
  /** The team the card shows first: the searched one, or the home side of a match picked from the day list. */
  subject: PanelTeam | null
  rival: PanelTeam | null
}

export function TeamPanel({ subject, rival }: TeamPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {subject ? (
        <>
          <TeamCard key={subject.id} teamId={subject.id} name={subject.name} logo={subject.logo} caption={subject.caption} />
          {rival ? <TeamCard key={rival.id} teamId={rival.id} name={rival.name} logo={rival.logo} caption={rival.caption} /> : null}
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
