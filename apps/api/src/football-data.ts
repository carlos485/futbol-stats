import type { Fixture, Team, TeamColors } from '@futbol/core'

export interface SeasonFixtures {
  /** Start year of the season, as reported by ESPN. */
  season: number
  /** Played and pending matches of the team in every competition, in any order. */
  fixtures: Fixture[]
}

/** What the analysis needs from the football data provider; cached behind the scenes. */
export interface FootballData {
  searchTeams(query: string): Promise<Team[]>
  /** The whole calendar of the team across competitions; the current season when `season` is omitted. */
  getSeasonFixtures(teamId: number, season?: number): Promise<SeasonFixtures>
  /** A competition's matches on a day, given as ESPN's `YYYYMMDD`; ESPN decides which timezone the day follows. */
  getScoreboard(competitionId: string, espnDate: string): Promise<Fixture[]>
  /** The match with its box score statistics, or `undefined` when ESPN has no summary for it. */
  getFixtureDetails(leagueId: string, fixtureId: number): Promise<Fixture | undefined>
  /** The team's brand colors, or `null` when the provider has none. */
  getTeamColors(teamId: number): Promise<TeamColors | null>
}
