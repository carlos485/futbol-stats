import { describe, expect, it } from 'vitest'
import { extractTeamStats, StatisticType, TeamNotInFixtureError } from './team-stats.ts'
import { AWAY_TEAM_ID, buildFixture, buildTeamStatistics, HOME_TEAM_ID } from './testing/fixtures.ts'

describe('extractTeamStats', () => {
  it('should_read_both_sides_of_the_match_when_statistics_are_present', () => {
    const fixture = buildFixture({
      homeGoals: 3,
      awayGoals: 1,
      statistics: [
        buildTeamStatistics(HOME_TEAM_ID, {
          [StatisticType.CornerKicks]: 7,
          [StatisticType.TotalShots]: 14,
          [StatisticType.ShotsOnGoal]: 6,
          [StatisticType.GoalkeeperSaves]: 2,
          [StatisticType.YellowCards]: 1,
          [StatisticType.RedCards]: 0,
        }),
        buildTeamStatistics(AWAY_TEAM_ID, { [StatisticType.CornerKicks]: 3 }),
      ],
    })

    expect(extractTeamStats(fixture, HOME_TEAM_ID)).toEqual({
      goalsFor: 3,
      goalsAgainst: 1,
      cornersFor: 7,
      cornersAgainst: 3,
      shotsTotal: 14,
      shotsOnTarget: 6,
      saves: 2,
      yellowCards: 1,
      redCards: 0,
      hasStats: true,
    })
  })

  it('should_swap_goals_and_corners_when_team_is_away', () => {
    const fixture = buildFixture({
      homeGoals: 3,
      awayGoals: 1,
      statistics: [
        buildTeamStatistics(HOME_TEAM_ID, { [StatisticType.CornerKicks]: 7 }),
        buildTeamStatistics(AWAY_TEAM_ID, { [StatisticType.CornerKicks]: 3 }),
      ],
    })

    const stats = extractTeamStats(fixture, AWAY_TEAM_ID)

    expect([stats.goalsFor, stats.goalsAgainst]).toEqual([1, 3])
    expect([stats.cornersFor, stats.cornersAgainst]).toEqual([3, 7])
  })

  it('should_use_zero_only_for_cards_when_statistic_values_are_null', () => {
    const fixture = buildFixture({
      statistics: [
        buildTeamStatistics(HOME_TEAM_ID, {
          [StatisticType.CornerKicks]: null,
          [StatisticType.YellowCards]: null,
          [StatisticType.RedCards]: null,
        }),
        buildTeamStatistics(AWAY_TEAM_ID, {}),
      ],
    })

    const stats = extractTeamStats(fixture, HOME_TEAM_ID)

    expect(stats.cornersFor).toBeNull()
    expect(stats.yellowCards).toBe(0)
    expect(stats.redCards).toBe(0)
    expect(stats.hasStats).toBe(true)
  })

  it('should_mark_everything_unavailable_when_fixture_has_no_statistics', () => {
    const stats = extractTeamStats(buildFixture(), HOME_TEAM_ID)

    expect(stats).toEqual({
      goalsFor: 2,
      goalsAgainst: 1,
      cornersFor: null,
      cornersAgainst: null,
      shotsTotal: null,
      shotsOnTarget: null,
      saves: null,
      yellowCards: null,
      redCards: null,
      hasStats: false,
    })
  })

  it('should_parse_numeric_text_when_value_comes_as_string', () => {
    const fixture = buildFixture({
      statistics: [buildTeamStatistics(HOME_TEAM_ID, { [StatisticType.TotalShots]: '12' })],
    })

    expect(extractTeamStats(fixture, HOME_TEAM_ID).shotsTotal).toBe(12)
  })

  it('should_throw_when_team_did_not_play_the_fixture', () => {
    expect(() => extractTeamStats(buildFixture(), 999)).toThrow(TeamNotInFixtureError)
  })
})
