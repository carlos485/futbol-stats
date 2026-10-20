import type { TeamMatchStats } from '@futbol/core'
import { describe, expect, it } from 'vitest'
import { formatAverage, formatCorners, formatLimaDate, formatLimaDateTime, formatScore, formatShare } from './format'

const EMPTY_STATS: TeamMatchStats = {
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

describe('format helpers', () => {
  it('should_show_lima_time_when_formatting_a_utc_date', () => {
    expect(formatLimaDateTime('2026-01-16T00:00:00.000Z')).toMatch(/7:00/)
  })

  it('should_use_the_lima_day_when_formatting_only_the_date', () => {
    expect(formatLimaDate('2026-01-16T02:00:00.000Z')).toContain('15')
  })

  it('should_use_the_lima_day_when_utc_is_already_the_next_day', () => {
    expect(formatLimaDateTime('2026-01-16T02:00:00.000Z')).toContain('15')
  })

  it('should_show_not_available_when_the_average_is_unknown', () => {
    expect(formatAverage({ total: 0, average: null, n: 0 })).toBe('N/D')
  })

  it('should_round_the_average_to_one_decimal_when_it_is_known', () => {
    expect(formatAverage({ total: 10, average: 3.3333, n: 3 })).toBe('3.3')
  })

  it('should_format_shares_as_percentages_when_given_a_fraction', () => {
    expect(formatShare(0.4567)).toBe('45.7%')
  })

  it('should_show_corners_for_and_total_when_both_sides_are_known', () => {
    expect(formatCorners({ ...EMPTY_STATS, cornersFor: 6, cornersAgainst: 4 })).toBe('6 / 10')
  })

  it('should_show_not_available_total_when_the_opponent_corners_are_missing', () => {
    expect(formatCorners({ ...EMPTY_STATS, cornersFor: 6 })).toBe('6 / N/D')
  })

  it('should_show_not_available_score_when_the_match_has_no_goals_yet', () => {
    expect(formatScore(null, null)).toBe('N/D')
    expect(formatScore(2, 1)).toBe('2 - 1')
  })
})
