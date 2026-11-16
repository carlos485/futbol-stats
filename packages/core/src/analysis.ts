import type { TeamAggregate } from './aggregate.ts'
import type { MatchPrediction } from './poisson.ts'
import type { Fixture } from './schemas/fixture.ts'
import type { TeamMatchStats } from './team-stats.ts'

export interface MatchTeam {
  id: number
  name: string
  logo: string
}

export interface MatchSummary {
  fixtureId: number
  date: string
  leagueName: string
  home: MatchTeam
  away: MatchTeam
  homeGoals: number | null
  awayGoals: number | null
  /** Statistics from the point of view of the analysed team. */
  stats: TeamMatchStats
}

export interface TeamAnalysis {
  teamId: number
  /** Most recent match first. */
  matches: MatchSummary[]
  aggregate: TeamAggregate
}

export type AnalysisWarningCode = 'NO_RECENT_MATCHES' | 'FEW_RECENT_MATCHES' | 'NO_HEAD_TO_HEAD' | 'NO_GOAL_DATA'

export interface AnalysisWarning {
  code: AnalysisWarningCode
  teamId?: number
}

/** Brand colors of a team as CSS hex values (`#rrggbb`). */
export interface TeamColors {
  primary: string
  /** Second color of the kit, for when the primary one clashes with the rival's. */
  alternate: string
}

/** A team's row in the table of a competition. */
export interface TeamStanding {
  competitionName: string
  /** Name of the group when the competition is split into several tables (e.g. a group stage); null otherwise. */
  group: string | null
  rank: number
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export interface AnalysisResponse {
  home: TeamAnalysis
  away: TeamAnalysis
  /** `null` when the provider has no colors for the team. */
  colors: { home: TeamColors | null; away: TeamColors | null }
  /** Head-to-head matches from the home team's point of view. */
  headToHead: TeamAnalysis
  prediction: MatchPrediction | null
  warnings: AnalysisWarning[]
}

export interface LineupPlayer {
  name: string
  jersey: string | null
  /** ESPN position abbreviation (e.g. 'G', 'CD-L', 'AM'). */
  position: string
}

export interface TeamLineup {
  /** The shape of the team, e.g. '4-2-3-1'. */
  formation: string
  starters: LineupPlayer[]
  substitutes: LineupPlayer[]
}

export interface MatchLineups {
  /** `null` while the lineup has not been published. */
  home: TeamLineup | null
  away: TeamLineup | null
}

export interface TeamFixturesResponse {
  /** Start year of the current season of the team's league, as reported by ESPN. */
  season: number
  /** Matches still to be played, soonest first. */
  upcoming: Fixture[]
  /** Matches already played this season, most recent first. */
  played: Fixture[]
}

/** Where a competition belongs: a country, a continent or the whole world, with an image of its flag or map. */
export interface CompetitionRegion {
  name: string
  /** URL of the flag or map image. */
  image: string
}

export interface MatchdayCompetition {
  /** ESPN slug of the competition (e.g. `esp.1`). */
  id: string
  name: string
  /** URL of the competition logo. */
  logo: string
  region: CompetitionRegion
  /** The competition's matches of the day, earliest first. */
  fixtures: Fixture[]
}

export interface MatchdayResponse {
  /** The day shown, as `YYYY-MM-DD` in Lima time. */
  date: string
  competitions: MatchdayCompetition[]
  /** Names of the competitions that could not be loaded; the rest of the list is still valid. */
  unavailable: string[]
}
