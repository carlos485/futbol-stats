import { describe, expect, it, vi } from 'vitest'
import { CacheStore } from '../cache/cache-store.ts'
import { NotFoundError } from '../errors.ts'
import { CURRENT_SEASON, createTestDatabase, espnSchedule, espnScheduleEvent, espnSummary } from '../testing/builders.ts'
import type { EspnSource } from './espn-client.ts'
import { EspnFootballData } from './espn-football-data.ts'

const SITE = 'https://espn.test/site'
const SEARCH = 'https://espn.test/search'
const TEAM_ID = 10
const MS_PER_HOUR = 60 * 60 * 1000

type Responder = (url: string) => unknown

function createService(respond: Responder) {
  const clock = { time: Date.UTC(2026, 9, 20) }
  const get = vi.fn(async (url: string, _schema?: unknown) => respond(url))
  const source = { get } as unknown as EspnSource
  const cache = new CacheStore(createTestDatabase(), () => clock.time)
  const service = new EspnFootballData(source, cache, { siteApiUrl: SITE, searchApiUrl: SEARCH })
  return { service, get, clock }
}

const calendarResponder: Responder = (url) => {
  if (url.endsWith('fixture=true')) {
    return espnSchedule([espnScheduleEvent({ id: 3, date: '2026-11-01T15:00Z', statusName: 'STATUS_SCHEDULED', statusState: 'pre' })])
  }
  return espnSchedule([espnScheduleEvent({ id: 1, homeScore: 2, awayScore: 0 }), espnScheduleEvent({ id: 2, homeScore: 1, awayScore: 1 })])
}

describe('EspnFootballData.searchTeams', () => {
  const searchResponse = { items: [{ id: '359', type: 'team', sport: 'soccer', league: 'eng.1', displayName: 'Arsenal' }] }

  it('should_query_the_search_api_and_keep_only_valid_teams', async () => {
    const { service, get } = createService(() => ({
      items: [...searchResponse.items, { id: '9', type: 'team', sport: 'soccer', league: 'club.friendly', displayName: 'Arsenal B' }],
    }))

    const teams = await service.searchTeams('Arsenal')

    expect(teams.map((entry) => entry.team.name)).toEqual(['Arsenal'])
    expect(get.mock.calls[0][0]).toContain(`${SEARCH}?query=arsenal`)
  })

  it('should_serve_the_second_search_from_cache_when_the_query_only_differs_in_case', async () => {
    const { service, get } = createService(() => searchResponse)

    await service.searchTeams('Arsenal')
    await service.searchTeams('  arsenal ')

    expect(get).toHaveBeenCalledOnce()
  })
})

describe('EspnFootballData.getSeasonFixtures', () => {
  it('should_merge_the_played_and_upcoming_calendars_when_the_season_is_not_given', async () => {
    const { service, get } = createService(calendarResponder)

    const result = await service.getSeasonFixtures(TEAM_ID)

    expect(result.season).toBe(CURRENT_SEASON)
    expect(result.fixtures.map((fixture) => fixture.fixture.id).sort()).toEqual([1, 2, 3])
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      `${SITE}/all/teams/10/schedule`,
      `${SITE}/all/teams/10/schedule?fixture=true`,
    ])
  })

  it('should_request_the_given_season_when_a_past_season_is_asked', async () => {
    const { service, get } = createService(() => espnSchedule([espnScheduleEvent({ id: 9 })], CURRENT_SEASON))

    const result = await service.getSeasonFixtures(TEAM_ID, 2024)

    expect(result.season).toBe(2024)
    expect(get).toHaveBeenCalledExactlyOnceWith(`${SITE}/all/teams/10/schedule?season=2024`, expect.anything())
  })

  it('should_serve_the_current_season_from_cache_within_the_hour_and_refresh_it_afterwards', async () => {
    const { service, get, clock } = createService(calendarResponder)
    await service.getSeasonFixtures(TEAM_ID)

    await service.getSeasonFixtures(TEAM_ID)
    expect(get).toHaveBeenCalledTimes(2)

    clock.time += MS_PER_HOUR
    await service.getSeasonFixtures(TEAM_ID)
    expect(get).toHaveBeenCalledTimes(4)
  })

  it('should_keep_a_past_season_cached_for_days_because_it_never_changes', async () => {
    const { service, get, clock } = createService(() => espnSchedule([]))
    await service.getSeasonFixtures(TEAM_ID, 2025)

    clock.time += 24 * MS_PER_HOUR
    await service.getSeasonFixtures(TEAM_ID, 2025)

    expect(get).toHaveBeenCalledOnce()
  })

  it('should_list_every_competition_and_drop_friendlies_when_the_calendar_mixes_them', async () => {
    const withLeague = (id: number, slug: string, name: string) => ({ ...espnScheduleEvent({ id }), league: { slug, name } })
    const { service } = createService((url) =>
      url.endsWith('fixture=true')
        ? espnSchedule([])
        : espnSchedule([
            withLeague(1, 'esp.1', 'LaLiga'),
            withLeague(2, 'uefa.champions', 'UEFA Champions League'),
            withLeague(3, 'club.friendly', 'Club Friendly'),
            withLeague(4, 'friendly.emirates_cup', 'Emirates Cup'),
          ]),
    )

    const { fixtures } = await service.getSeasonFixtures(TEAM_ID)

    expect(fixtures.map((fixture) => fixture.league.id)).toEqual(['esp.1', 'uefa.champions'])
  })
})

describe('EspnFootballData.getFixtureDetails', () => {
  it('should_encode_the_competition_slug_when_building_the_summary_url', async () => {
    const { service, get } = createService(() => espnSummary())

    await service.getFixtureDetails('a/b?c', 55)

    expect(get.mock.calls[0][0]).toBe(`${SITE}/a%2Fb%3Fc/summary?event=55`)
  })

  it('should_cache_finished_matches_forever_so_the_summary_is_requested_once', async () => {
    const { service, get, clock } = createService(() => espnSummary())

    const first = await service.getFixtureDetails('eng.1', 55)
    clock.time += 1000 * 24 * MS_PER_HOUR
    const second = await service.getFixtureDetails('eng.1', 55)

    expect(get).toHaveBeenCalledExactlyOnceWith(`${SITE}/eng.1/summary?event=55`, expect.anything())
    expect(second).toEqual(first)
    expect(first?.statistics).toBeDefined()
  })

  it('should_not_cache_matches_that_are_not_finished_because_they_can_still_change', async () => {
    const { service, get } = createService(() =>
      espnSummary({ homeStatistics: {}, awayStatistics: {}, statusName: 'STATUS_SCHEDULED', statusState: 'pre' }),
    )

    await service.getFixtureDetails('eng.1', 55)
    await service.getFixtureDetails('eng.1', 55)

    expect(get).toHaveBeenCalledTimes(2)
  })

  it('should_return_undefined_when_espn_has_no_summary_for_the_match', async () => {
    const { service } = createService(() => {
      throw new NotFoundError('missing')
    })

    await expect(service.getFixtureDetails('eng.1', 55)).resolves.toBeUndefined()
  })
})
