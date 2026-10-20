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

export interface AnalysisResponse {
  home: TeamAnalysis
  away: TeamAnalysis
  /** Head-to-head matches from the home team's point of view. */
  headToHead: TeamAnalysis
  prediction: MatchPrediction | null
  warnings: AnalysisWarning[]
}

export interface TeamFixturesResponse {
  /** Start year of the current season of the team's league, as reported by ESPN. */
  season: number
  /** Matches still to be played, soonest first. */
  upcoming: Fixture[]
  /** Matches already played this season, most recent first. */
  played: Fixture[]
}
