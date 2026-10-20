import { describe, expect, it } from 'vitest'
import { aggregate } from './aggregate.ts'
import { blendExpectedGoals, expectedGoals, predictFromAggregates, predictMatch } from './poisson.ts'
import type { TeamMatchStats } from './team-stats.ts'

const PRECISION_DIGITS = 10

function buildScoredMatch(goalsFor: number, goalsAgainst: number): TeamMatchStats {
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

describe('predictMatch', () => {
  it('should_sum_outcome_probabilities_to_one_when_lambdas_are_realistic', () => {
    const prediction = predictMatch(1.7, 1.1)

    const sum = prediction.teamAWin + prediction.draw + prediction.teamBWin
    expect(sum).toBeCloseTo(1, PRECISION_DIGITS)
  })

  it('should_give_equal_win_probabilities_when_teams_are_identical', () => {
    const prediction = predictMatch(1.4, 1.4)

    expect(prediction.teamAWin).toBeCloseTo(prediction.teamBWin, PRECISION_DIGITS)
  })

  it('should_favour_the_stronger_team_when_lambdas_differ', () => {
    const prediction = predictMatch(2.5, 0.8)

    expect(prediction.teamAWin).toBeGreaterThan(prediction.teamBWin)
    expect(prediction.mostLikelyScore.teamA).toBeGreaterThan(prediction.mostLikelyScore.teamB)
  })

  it('should_return_the_mode_as_most_likely_score_when_lambdas_are_low', () => {
    const prediction = predictMatch(0.5, 0.5)

    expect(prediction.mostLikelyScore).toMatchObject({ teamA: 0, teamB: 0 })
  })

  it('should_increase_over_two_point_five_when_expected_goals_grow', () => {
    expect(predictMatch(2.5, 2.0).overTwoPointFive).toBeGreaterThan(predictMatch(0.8, 0.8).overTwoPointFive)
  })

  it('should_not_break_when_lambda_is_zero', () => {
    const prediction = predictMatch(0, 0)

    expect(Number.isFinite(prediction.teamAWin)).toBe(true)
    expect(prediction.teamAWin + prediction.draw + prediction.teamBWin).toBeCloseTo(1, PRECISION_DIGITS)
  })
})

describe('expected goals', () => {
  it('should_average_attack_and_opponent_defence_when_computing_lambda', () => {
    expect(expectedGoals(2, 1)).toBe(1.5)
  })

  it('should_weight_form_70_and_head_to_head_30_when_head_to_head_exists', () => {
    expect(blendExpectedGoals(2, 1)).toBeCloseTo(1.7, PRECISION_DIGITS)
  })

  it('should_keep_form_estimate_when_there_is_no_head_to_head', () => {
    expect(blendExpectedGoals(2, null)).toBe(2)
  })

  it('should_floor_at_minimum_when_estimate_is_zero', () => {
    expect(blendExpectedGoals(0, 0)).toBe(0.1)
  })
})

describe('predictFromAggregates', () => {
  it('should_give_symmetric_probabilities_when_both_teams_have_the_same_record', () => {
    const record = aggregate([buildScoredMatch(2, 1), buildScoredMatch(1, 1)])

    const prediction = predictFromAggregates(record, record)

    expect(prediction?.teamAWin).toBeCloseTo(prediction?.teamBWin ?? NaN, PRECISION_DIGITS)
  })

  it('should_return_null_when_a_team_has_no_goal_data', () => {
    const record = aggregate([buildScoredMatch(2, 1)])

    expect(predictFromAggregates(record, aggregate([]))).toBeNull()
  })

  it('should_pull_expected_goals_towards_head_to_head_when_it_is_provided', () => {
    const record = aggregate([buildScoredMatch(1, 1)])
    const headToHead = aggregate([buildScoredMatch(4, 0)])

    const withH2h = predictFromAggregates(record, record, headToHead)
    const withoutH2h = predictFromAggregates(record, record)

    expect(withH2h?.expectedGoalsA).toBeGreaterThan(withoutH2h?.expectedGoalsA ?? Infinity)
    expect(withH2h?.expectedGoalsB).toBeLessThan(withoutH2h?.expectedGoalsB ?? -Infinity)
  })
})
