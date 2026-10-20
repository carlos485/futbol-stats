import type { Fixture } from '../schemas/fixture.ts'
import type { TeamStatistics } from '../schemas/statistics.ts'

export const HOME_TEAM_ID = 10
export const AWAY_TEAM_ID = 20

type StatisticValues = Record<string, number | string | null>

export function buildTeamStatistics(teamId: number, values: StatisticValues): TeamStatistics {
  return {
    team: { id: teamId, name: `Team ${teamId}` },
    statistics: Object.entries(values).map(([type, value]) => ({ type, value })),
  }
}

interface FixtureOverrides {
  id?: number
  homeGoals?: number | null
  awayGoals?: number | null
  statistics?: TeamStatistics[]
}

export function buildFixture({
  id = 1,
  homeGoals = 2,
  awayGoals = 1,
  statistics,
}: FixtureOverrides = {}): Fixture {
  return {
    fixture: { id, date: '2026-01-01T20:00:00+00:00', status: { short: 'FT' } },
    league: { id: 'eng.1', name: 'Premier League', season: 2025 },
    teams: {
      home: { id: HOME_TEAM_ID, name: 'Home', logo: 'home.png' },
      away: { id: AWAY_TEAM_ID, name: 'Away', logo: 'away.png' },
    },
    goals: { home: homeGoals, away: awayGoals },
    statistics,
  }
}
