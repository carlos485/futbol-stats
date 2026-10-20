import type { Fixture } from './schemas/fixture.ts'
import type { TeamStatistics } from './schemas/statistics.ts'

// A const object instead of an enum: `apps/web` compiles this package with `erasableSyntaxOnly`.
export const StatisticType = {
  CornerKicks: 'Corner Kicks',
  TotalShots: 'Total Shots',
  ShotsOnGoal: 'Shots on Goal',
  GoalkeeperSaves: 'Goalkeeper Saves',
  YellowCards: 'Yellow Cards',
  RedCards: 'Red Cards',
} as const

export type StatisticType = (typeof StatisticType)[keyof typeof StatisticType]

export interface TeamMatchStats {
  goalsFor: number | null
  goalsAgainst: number | null
  cornersFor: number | null
  cornersAgainst: number | null
  shotsTotal: number | null
  shotsOnTarget: number | null
  saves: number | null
  yellowCards: number | null
  redCards: number | null
  hasStats: boolean
}

export class TeamNotInFixtureError extends Error {
  constructor(teamId: number, fixtureId: number) {
    super(`Team ${teamId} did not play fixture ${fixtureId}`)
    this.name = 'TeamNotInFixtureError'
  }
}

function parseStatisticValue(value: number | string | null): number | null {
  if (typeof value === 'number') {
    return value
  }
  if (value === null) {
    return null
  }
  const parsed = Number(value.replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

function readStatistic(entry: TeamStatistics | undefined, type: StatisticType): number | null {
  const statistic = entry?.statistics.find((item) => item.type === type)
  return statistic ? parseStatisticValue(statistic.value) : null
}

// A missing card count means "no cards" once the match has statistics, but unknown without them.
function readCardCount(entry: TeamStatistics | undefined, type: StatisticType): number | null {
  if (!entry) {
    return null
  }
  return readStatistic(entry, type) ?? 0
}

export function extractTeamStats(fixture: Fixture, teamId: number): TeamMatchStats {
  const { home, away } = fixture.teams
  const isHome = home.id === teamId
  if (!isHome && away.id !== teamId) {
    throw new TeamNotInFixtureError(teamId, fixture.fixture.id)
  }

  const opponentId = isHome ? away.id : home.id
  const ownEntry = fixture.statistics?.find((entry) => entry.team.id === teamId)
  const opponentEntry = fixture.statistics?.find((entry) => entry.team.id === opponentId)

  return {
    goalsFor: isHome ? fixture.goals.home : fixture.goals.away,
    goalsAgainst: isHome ? fixture.goals.away : fixture.goals.home,
    cornersFor: readStatistic(ownEntry, StatisticType.CornerKicks),
    cornersAgainst: readStatistic(opponentEntry, StatisticType.CornerKicks),
    shotsTotal: readStatistic(ownEntry, StatisticType.TotalShots),
    shotsOnTarget: readStatistic(ownEntry, StatisticType.ShotsOnGoal),
    saves: readStatistic(ownEntry, StatisticType.GoalkeeperSaves),
    yellowCards: readCardCount(ownEntry, StatisticType.YellowCards),
    redCards: readCardCount(ownEntry, StatisticType.RedCards),
    hasStats: ownEntry !== undefined,
  }
}
