import type { MatchSummary, TeamAnalysis, TeamMatchStats } from '@futbol/core'
import { aggregate } from '@futbol/core'
import { describe, expect, it } from 'vitest'
import { buildFormSquares } from './form'

const TEAM_ID = 10

function stats(goalsFor: number | null, goalsAgainst: number | null): TeamMatchStats {
  return {
    goalsFor,
    goalsAgainst,
    cornersFor: null,
    cornersAgainst: null,
    shotsTotal: null,
    shotsOnTarget: null,
    saves: null,
    yellowCards: null,
    redCards: null,
    hasStats: false,
  }
}

function summary(fixtureId: number, matchStats: TeamMatchStats, isHome = true): MatchSummary {
  const team = { id: TEAM_ID, name: 'Mine', logo: 'mine.png' }
  const rival = { id: 99, name: 'Rival FC', logo: 'rival.png' }
  return {
    fixtureId,
    date: '2026-01-01T20:00:00Z',
    leagueName: 'League',
    home: isHome ? team : rival,
    away: isHome ? rival : team,
    homeGoals: matchStats.goalsFor,
    awayGoals: matchStats.goalsAgainst,
    stats: matchStats,
  }
}

function analysisOf(matches: MatchSummary[]): TeamAnalysis {
  return { teamId: TEAM_ID, matches, aggregate: aggregate(matches.map((match) => match.stats)) }
}

describe('buildFormSquares', () => {
  it('should_put_the_latest_match_last_when_the_analysis_lists_the_most_recent_first', () => {
    const squares = buildFormSquares(analysisOf([summary(3, stats(2, 0)), summary(2, stats(1, 1)), summary(1, stats(0, 1))]))

    expect(squares.map((square) => square.fixtureId)).toEqual([1, 2, 3])
    expect(squares.map((square) => square.result)).toEqual(['L', 'D', 'W'])
  })

  it('should_keep_only_the_five_latest_matches_when_there_are_more', () => {
    const matches = [7, 6, 5, 4, 3, 2, 1].map((id) => summary(id, stats(1, 0)))

    expect(buildFormSquares(analysisOf(matches)).map((square) => square.fixtureId)).toEqual([3, 4, 5, 6, 7])
  })

  it('should_skip_matches_without_a_final_score', () => {
    const squares = buildFormSquares(analysisOf([summary(2, stats(null, null)), summary(1, stats(1, 0))]))

    expect(squares.map((square) => square.fixtureId)).toEqual([1])
  })

  it('should_describe_the_match_from_the_team_point_of_view', () => {
    const [home] = buildFormSquares(analysisOf([summary(1, stats(2, 1), true)]))
    const [away] = buildFormSquares(analysisOf([summary(2, stats(0, 3), false)]))

    expect(home.description).toBe('Victoria 2 - 1 vs Rival FC')
    expect(away.description).toBe('Derrota 0 - 3 en Rival FC')
  })

  it('should_return_no_squares_when_the_team_has_no_matches', () => {
    expect(buildFormSquares(analysisOf([]))).toEqual([])
  })
})
