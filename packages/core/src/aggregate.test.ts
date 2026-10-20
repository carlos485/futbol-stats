import { describe, expect, it } from 'vitest'
import { aggregate } from './aggregate.ts'
import type { TeamMatchStats } from './team-stats.ts'

const NO_STATS: TeamMatchStats = {
  goalsFor: 0,
  goalsAgainst: 0,
  cornersFor: null,
  cornersAgainst: null,
  shotsTotal: null,
  shotsOnTarget: null,
  saves: null,
  yellowCards: null,
  redCards: null,
  hasStats: false,
}

function buildMatch(overrides: Partial<TeamMatchStats>): TeamMatchStats {
  return { ...NO_STATS, ...overrides }
}

describe('aggregate', () => {
  it('should_average_only_matches_with_data_when_some_statistics_are_missing', () => {
    const result = aggregate([
      buildMatch({ cornersFor: 6, cornersAgainst: 4, hasStats: true }),
      buildMatch({ cornersFor: 2, cornersAgainst: 2, hasStats: true }),
      buildMatch({}),
    ])

    expect(result.matches).toBe(3)
    expect(result.metrics.cornersFor).toEqual({ total: 8, average: 4, n: 2 })
    expect(result.metrics.cornersTotal).toEqual({ total: 14, average: 7, n: 2 })
  })

  it('should_report_null_average_when_no_match_has_data', () => {
    const result = aggregate([buildMatch({}), buildMatch({})])

    expect(result.metrics.shotsTotal).toEqual({ total: 0, average: null, n: 0 })
  })

  it('should_sum_goals_for_against_and_total_when_matches_are_finished', () => {
    const result = aggregate([
      buildMatch({ goalsFor: 3, goalsAgainst: 1 }),
      buildMatch({ goalsFor: 1, goalsAgainst: 1 }),
    ])

    expect(result.metrics.goalsFor.average).toBe(2)
    expect(result.metrics.goalsAgainst.average).toBe(1)
    expect(result.metrics.goalsTotal.average).toBe(3)
  })

  it('should_build_form_in_input_order_when_matches_have_scores', () => {
    const result = aggregate([
      buildMatch({ goalsFor: 2, goalsAgainst: 0 }),
      buildMatch({ goalsFor: 1, goalsAgainst: 1 }),
      buildMatch({ goalsFor: 0, goalsAgainst: 3 }),
      buildMatch({ goalsFor: null, goalsAgainst: null }),
    ])

    expect(result.form).toEqual(['W', 'D', 'L'])
  })

  it('should_return_empty_aggregate_when_there_are_no_matches', () => {
    const result = aggregate([])

    expect(result.matches).toBe(0)
    expect(result.form).toEqual([])
    expect(result.metrics.goalsFor.average).toBeNull()
  })
})
