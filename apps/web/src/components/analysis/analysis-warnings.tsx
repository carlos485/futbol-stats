import type { AnalysisWarning, AnalysisWarningCode } from '@futbol/core'

interface AnalysisWarningsProps {
  warnings: AnalysisWarning[]
  teamNames: Record<number, string>
}

const WARNING_MESSAGES: Record<AnalysisWarningCode, (teamName: string) => string> = {
  NO_RECENT_MATCHES: (teamName) => `No hay partidos previos de ${teamName} en la temporada disponible.`,
  FEW_RECENT_MATCHES: (teamName) =>
    `${teamName} tiene menos de 5 partidos previos en la temporada, así que los promedios son menos fiables.`,
  NO_HEAD_TO_HEAD: () => 'No hay enfrentamientos directos disponibles.',
  NO_GOAL_DATA: () => 'No hay datos de goles suficientes para calcular las probabilidades.',
}

export function AnalysisWarnings({ warnings, teamNames }: AnalysisWarningsProps) {
  if (warnings.length === 0) {
    return null
  }
  return (
    <ul className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
      {warnings.map((warning) => (
        <li key={`${warning.code}-${warning.teamId ?? 'all'}`}>
          {WARNING_MESSAGES[warning.code](teamNames[warning.teamId ?? 0] ?? 'el equipo')}
        </li>
      ))}
    </ul>
  )
}
