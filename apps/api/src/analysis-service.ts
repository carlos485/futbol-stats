import {
  aggregate,
  extractTeamStats,
  predictFromAggregates,
  type AnalysisResponse,
  type AnalysisWarning,
  type Fixture,
  type MatchSummary,
  type TeamAnalysis,
} from '@futbol/core'
import { HttpError } from './errors.ts'
import { byMostRecentFirst, RECENT_MATCHES_COUNT, selectRecentBefore } from './fixture-selection.ts'
import type { FootballData, SeasonFixtures } from './football-data.ts'
import { logger } from './logger.ts'

// Head-to-head history is thin within one season, so the previous seasons of the home team are searched too.
const HEAD_TO_HEAD_SEASONS_BACK = 2
const RECENT_FORM_SEASONS_BACK = 1

export interface AnalysisRequest {
  homeTeamId: number
  awayTeamId: number
  /** ISO date of the match; the analysis only looks at matches played before it. */
  kickoff: string
}

function toMatchSummary(fixture: Fixture, teamId: number): MatchSummary {
  const { home, away } = fixture.teams
  return {
    fixtureId: fixture.fixture.id,
    date: fixture.fixture.date,
    leagueName: fixture.league.name,
    home: { id: home.id, name: home.name, logo: home.logo },
    away: { id: away.id, name: away.name, logo: away.logo },
    homeGoals: fixture.goals.home,
    awayGoals: fixture.goals.away,
    stats: extractTeamStats(fixture, teamId),
  }
}

function toTeamAnalysis(teamId: number, fixtures: Fixture[]): TeamAnalysis {
  const matches = fixtures.map((fixture) => toMatchSummary(fixture, teamId))
  return { teamId, matches, aggregate: aggregate(matches.map((match) => match.stats)) }
}

function facing(fixtures: Fixture[], opponentId: number): Fixture[] {
  return fixtures.filter((fixture) => fixture.teams.home.id === opponentId || fixture.teams.away.id === opponentId)
}

export class AnalysisService {
  constructor(private readonly football: FootballData) {}

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const { homeTeamId, awayTeamId, kickoff } = request

    const [homeCurrent, awayCurrent] = await Promise.all([
      this.football.getSeasonFixtures(homeTeamId),
      this.football.getSeasonFixtures(awayTeamId),
    ])
    const [homeHistory, awayHistory] = await Promise.all([
      this.loadHistory(homeTeamId, homeCurrent, HEAD_TO_HEAD_SEASONS_BACK),
      this.loadHistory(awayTeamId, awayCurrent, RECENT_FORM_SEASONS_BACK),
    ])

    const recent = {
      home: selectRecentBefore(homeHistory, kickoff),
      away: selectRecentBefore(awayHistory, kickoff),
      headToHead: selectRecentBefore(facing(homeHistory, awayTeamId), kickoff),
    }
    const detailed = await this.loadDetails(Object.values(recent).flat())
    const withDetail = (fixtures: Fixture[]) =>
      fixtures.map((item) => detailed.get(item.fixture.id) ?? item).sort(byMostRecentFirst)

    const home = toTeamAnalysis(homeTeamId, withDetail(recent.home))
    const away = toTeamAnalysis(awayTeamId, withDetail(recent.away))
    const headToHead = toTeamAnalysis(homeTeamId, withDetail(recent.headToHead))
    const prediction = predictFromAggregates(home.aggregate, away.aggregate, headToHead.aggregate)

    return { home, away, headToHead, prediction, warnings: this.collectWarnings(home, away, headToHead, prediction !== null) }
  }

  /** The current season plus up to `seasonsBack` previous ones, as a flat list of fixtures. */
  private async loadHistory(teamId: number, current: SeasonFixtures, seasonsBack: number): Promise<Fixture[]> {
    const previousSeasons = Array.from({ length: seasonsBack }, (_, index) => current.season - index - 1)
    const previous = await Promise.all(previousSeasons.map((season) => this.loadPastSeason(teamId, season)))
    return [...current.fixtures, ...previous.flat()]
  }

  // A team can be new to the competition (promotion) and have no previous calendar; that only means less history.
  private async loadPastSeason(teamId: number, season: number): Promise<Fixture[]> {
    try {
      return (await this.football.getSeasonFixtures(teamId, season)).fixtures
    } catch (error) {
      if (!(error instanceof HttpError)) throw error
      logger.warn(`[analysis] no ${season} calendar for team ${teamId}: ${error.message}`)
      return []
    }
  }

  // Box score statistics only exist in the match summary, so every analysed match is looked up there.
  private async loadDetails(fixtures: Fixture[]): Promise<Map<number, Fixture>> {
    const unique = [...new Map(fixtures.map((fixture) => [fixture.fixture.id, fixture])).values()]
    const details = await Promise.all(
      unique.map((fixture) => this.football.getFixtureDetails(fixture.league.id, fixture.fixture.id)),
    )
    return new Map(details.flatMap((detail) => (detail ? [[detail.fixture.id, detail] as const] : [])))
  }

  private collectWarnings(
    home: TeamAnalysis,
    away: TeamAnalysis,
    headToHead: TeamAnalysis,
    hasPrediction: boolean,
  ): AnalysisWarning[] {
    const warnings: AnalysisWarning[] = []
    for (const team of [home, away]) {
      if (team.matches.length === 0) {
        warnings.push({ code: 'NO_RECENT_MATCHES', teamId: team.teamId })
      } else if (team.matches.length < RECENT_MATCHES_COUNT) {
        warnings.push({ code: 'FEW_RECENT_MATCHES', teamId: team.teamId })
      }
    }
    if (headToHead.matches.length === 0) {
      warnings.push({ code: 'NO_HEAD_TO_HEAD' })
    }
    if (!hasPrediction) {
      warnings.push({ code: 'NO_GOAL_DATA' })
    }
    return warnings
  }
}
