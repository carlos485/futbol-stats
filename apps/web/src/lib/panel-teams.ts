import type { Fixture, Team } from '@futbol/core'

export interface PanelTeam {
  id: number
  name: string
  logo: string
  /** Small label above the crest ("Rival", "Local", ...). */
  caption?: string
}

export interface PanelTeams {
  subject: PanelTeam | null
  rival: PanelTeam | null
}

/**
 * The teams to show in the first column. A searched team always leads, with the opponent of the chosen
 * match below it; a match picked from the list of the day (no searched team) shows both sides instead.
 */
export function selectPanelTeams(team: Team | null, fixture: Fixture | null): PanelTeams {
  if (team) {
    const subject: PanelTeam = { id: team.team.id, name: team.team.name, logo: team.team.logo }
    if (!fixture) return { subject, rival: null }
    const { home, away } = fixture.teams
    return { subject, rival: { ...(home.id === team.team.id ? away : home), caption: 'Rival' } }
  }
  if (fixture) {
    return {
      subject: { ...fixture.teams.home, caption: 'Local' },
      rival: { ...fixture.teams.away, caption: 'Visitante' },
    }
  }
  return { subject: null, rival: null }
}
