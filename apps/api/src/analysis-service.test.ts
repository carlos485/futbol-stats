import { StatisticType, type Fixture } from '@futbol/core'
import { describe, expect, it, vi } from 'vitest'
import { AnalysisService, type AnalysisRequest } from './analysis-service.ts'
import { EspnError } from './errors.ts'
import type { FootballData } from './football-data.ts'
import { buildFixture, buildFootballStub, CURRENT_SEASON } from './testing/builders.ts'

const LEAGUE = 'eng.1'
const HOME_ID = 10
const AWAY_ID = 20
const OTHER_ID = 30
const KICKOFF = '2026-03-01T20:00:00+00:00'

const request: AnalysisRequest = { homeTeamId: HOME_ID, awayTeamId: AWAY_ID, kickoff: KICKOFF }

function match(id: number, date: string, overrides: Parameters<typeof buildFixture>[0] = {}): Fixture {
  return buildFixture({ id, homeId: HOME_ID, awayId: OTHER_ID, date: `${date}T20:00:00+00:00`, ...overrides })
}

function withCorners(fixture: Fixture, homeCorners: number, awayCorners: number): Fixture {
  const statistics = [
    { team: fixture.teams.home, value: homeCorners },
    { team: fixture.teams.away, value: awayCorners },
  ].map(({ team, value }) => ({
    team: { id: team.id, name: team.name },
    statistics: [{ type: StatisticType.CornerKicks, value }],
  }))
  return { ...fixture, statistics }
}

/** Calendars per team and season: `calendars[teamId][season]`; unknown ones are empty. */
function calendars(byTeam: Record<number, Record<number, Fixture[]>>): FootballData['getSeasonFixtures'] {
  return async (teamId: number, season?: number) => {
    const resolved = season ?? CURRENT_SEASON
    return { season: resolved, fixtures: byTeam[teamId]?.[resolved] ?? [] }
  }
}

describe('AnalysisService', () => {
  it('should_use_only_the_five_latest_matches_before_the_kickoff_when_the_season_has_more', async () => {
    const season = Array.from({ length: 8 }, (_, index) => match(index + 1, `2026-02-${String(index + 1).padStart(2, '0')}`))
    const service = new AnalysisService(buildFootballStub({ getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: season } }) }))

    const result = await service.analyze(request)

    expect(result.home.matches.map((item) => item.fixtureId)).toEqual([8, 7, 6, 5, 4])
  })

  it('should_exclude_matches_played_at_or_after_the_kickoff_and_those_not_finished', async () => {
    const season = [
      match(1, '2026-02-01'),
      match(2, '2026-02-10', { status: 'PST' }),
      buildFixture({ id: 3, homeId: HOME_ID, awayId: OTHER_ID, date: KICKOFF }),
      match(4, '2026-04-01'),
    ]
    const service = new AnalysisService(buildFootballStub({ getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: season } }) }))

    const result = await service.analyze(request)

    expect(result.home.matches.map((item) => item.fixtureId)).toEqual([1])
  })

  it('should_complete_the_recent_form_with_the_previous_season_when_the_current_one_is_young', async () => {
    const current = [match(1, '2026-02-01'), match(2, '2026-02-08')]
    const previous = [match(3, '2025-05-01'), match(4, '2025-05-08'), match(5, '2025-05-15'), match(6, '2025-05-22')]
    const service = new AnalysisService(
      buildFootballStub({
        getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: current, [CURRENT_SEASON - 1]: previous } }),
      }),
    )

    const result = await service.analyze(request)

    expect(result.home.matches.map((item) => item.fixtureId)).toEqual([2, 1, 6, 5, 4])
    expect(result.warnings.some((warning) => warning.code === 'FEW_RECENT_MATCHES' && warning.teamId === HOME_ID)).toBe(false)
  })

  it('should_find_the_head_to_head_across_the_last_three_seasons_of_the_home_team', async () => {
    const versus = (id: number, date: string) => buildFixture({ id, homeId: AWAY_ID, awayId: HOME_ID, date: `${date}T20:00:00+00:00` })
    const service = new AnalysisService(
      buildFootballStub({
        getSeasonFixtures: calendars({
          [HOME_ID]: {
            [CURRENT_SEASON]: [versus(1, '2026-01-10'), match(2, '2026-01-20')],
            [CURRENT_SEASON - 1]: [versus(3, '2025-03-10')],
            [CURRENT_SEASON - 2]: [versus(4, '2024-03-10')],
            [CURRENT_SEASON - 3]: [versus(5, '2023-03-10')],
          },
        }),
      }),
    )

    const result = await service.analyze(request)

    expect(result.headToHead.matches.map((item) => item.fixtureId)).toEqual([1, 3, 4])
  })

  it('should_keep_going_without_that_season_when_a_previous_calendar_is_missing', async () => {
    const current = [match(1, '2026-02-01')]
    const getSeasonFixtures = vi.fn(async (teamId: number, season?: number) => {
      if (season !== undefined) throw new EspnError('no calendar')
      return { season: CURRENT_SEASON, fixtures: teamId === HOME_ID ? current : [] }
    })
    const service = new AnalysisService(buildFootballStub({ getSeasonFixtures }))

    const result = await service.analyze(request)

    expect(result.home.matches.map((item) => item.fixtureId)).toEqual([1])
  })

  it('should_not_hide_unexpected_errors_when_a_previous_calendar_fails_for_other_reasons', async () => {
    const getSeasonFixtures = vi.fn(async (_teamId: number, season?: number) => {
      if (season !== undefined) throw new TypeError('bug')
      return { season: CURRENT_SEASON, fixtures: [] }
    })
    const service = new AnalysisService(buildFootballStub({ getSeasonFixtures }))

    await expect(service.analyze(request)).rejects.toThrow(TypeError)
  })

  it('should_use_statistics_from_the_match_details_when_building_the_aggregates', async () => {
    const recent = match(1, '2026-02-01', { homeGoals: 2, awayGoals: 0 })
    const service = new AnalysisService(
      buildFootballStub({
        getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: [recent] } }),
        getFixtureDetails: async () => withCorners(recent, 6, 2),
      }),
    )

    const result = await service.analyze(request)

    expect(result.home.aggregate.metrics.cornersFor).toEqual({ total: 6, average: 6, n: 1 })
    expect(result.home.aggregate.metrics.cornersAgainst.average).toBe(2)
    expect(result.home.aggregate.form).toEqual(['W'])
  })

  it('should_fall_back_to_the_calendar_entry_when_espn_has_no_details_for_the_match', async () => {
    const service = new AnalysisService(
      buildFootballStub({ getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: [match(1, '2026-02-01')] } }) }),
    )

    const result = await service.analyze(request)

    expect(result.home.matches[0].stats.hasStats).toBe(false)
  })

  it('should_request_the_details_of_each_match_only_once_when_it_appears_in_several_lists', async () => {
    const shared = buildFixture({ id: 5, homeId: HOME_ID, awayId: AWAY_ID, date: '2026-02-01T20:00:00+00:00' })
    const getFixtureDetails = vi.fn(async () => shared)
    const service = new AnalysisService(
      buildFootballStub({
        getSeasonFixtures: calendars({
          [HOME_ID]: { [CURRENT_SEASON]: [shared] },
          [AWAY_ID]: { [CURRENT_SEASON]: [shared] },
        }),
        getFixtureDetails,
      }),
    )

    await service.analyze(request)

    expect(getFixtureDetails).toHaveBeenCalledExactlyOnceWith(LEAGUE, 5)
  })

  it('should_warn_about_missing_data_when_the_teams_have_no_previous_matches', async () => {
    const result = await new AnalysisService(buildFootballStub()).analyze(request)

    expect(result.prediction).toBeNull()
    expect(result.warnings).toEqual([
      { code: 'NO_RECENT_MATCHES', teamId: HOME_ID },
      { code: 'NO_RECENT_MATCHES', teamId: AWAY_ID },
      { code: 'NO_HEAD_TO_HEAD' },
      { code: 'NO_GOAL_DATA' },
    ])
  })

  it('should_warn_about_few_matches_when_fewer_than_five_previous_matches_exist', async () => {
    const service = new AnalysisService(
      buildFootballStub({ getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: [match(1, '2026-02-01')] } }) }),
    )

    const result = await service.analyze(request)

    expect(result.warnings).toContainEqual({ code: 'FEW_RECENT_MATCHES', teamId: HOME_ID })
  })
})

describe('AnalysisService.teamForm', () => {
  const AS_OF = '2026-10-25T12:00:00Z'

  it('should_return_the_five_latest_played_matches_before_the_given_time', async () => {
    const season = [
      ...Array.from({ length: 7 }, (_, index) => match(index + 1, `2026-09-${String(index + 1).padStart(2, '0')}`)),
      match(8, '2026-10-30', { status: 'NS' }),
    ]
    const service = new AnalysisService(buildFootballStub({ getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: season } }) }))

    const form = await service.teamForm(HOME_ID, AS_OF)

    expect(form.teamId).toBe(HOME_ID)
    expect(form.matches.map((item) => item.fixtureId)).toEqual([7, 6, 5, 4, 3])
  })

  it('should_average_the_statistics_of_those_matches_when_their_details_are_available', async () => {
    const recent = [match(1, '2026-09-01'), match(2, '2026-09-08')]
    const details = new Map([[1, withCorners(recent[0], 8, 2)], [2, withCorners(recent[1], 4, 2)]])
    const service = new AnalysisService(
      buildFootballStub({
        getSeasonFixtures: calendars({ [HOME_ID]: { [CURRENT_SEASON]: recent } }),
        getFixtureDetails: async (_league, fixtureId) => details.get(fixtureId),
      }),
    )

    const form = await service.teamForm(HOME_ID, AS_OF)

    expect(form.aggregate.metrics.cornersFor).toEqual({ total: 12, average: 6, n: 2 })
  })

  it('should_complete_the_form_with_the_previous_season_when_the_current_one_is_young', async () => {
    const service = new AnalysisService(
      buildFootballStub({
        getSeasonFixtures: calendars({
          [HOME_ID]: {
            [CURRENT_SEASON]: [match(1, '2026-09-01')],
            [CURRENT_SEASON - 1]: [match(2, '2025-05-01'), match(3, '2025-05-08'), match(4, '2025-05-15'), match(5, '2025-05-22')],
          },
        }),
      }),
    )

    const form = await service.teamForm(HOME_ID, AS_OF)

    expect(form.matches.map((item) => item.fixtureId)).toEqual([1, 5, 4, 3, 2])
  })

  it('should_return_an_empty_form_when_the_team_has_not_played_yet', async () => {
    const form = await new AnalysisService(buildFootballStub()).teamForm(HOME_ID, AS_OF)

    expect(form.matches).toEqual([])
    expect(form.aggregate.form).toEqual([])
  })
})
