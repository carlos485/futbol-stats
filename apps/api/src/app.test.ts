import type { AnalysisResponse, Fixture, MatchdayResponse, TeamAnalysis, TeamFixturesResponse } from '@futbol/core'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.ts'
import { EspnError, NotFoundError } from './errors.ts'
import { buildFixture, buildFootballStub, CURRENT_SEASON } from './testing/builders.ts'

const KICKOFF = '2026-03-01T20:00:00+00:00'
const NOW = new Date('2026-10-25T12:00:00.000Z')
const ANALYSIS_URL = `/api/analysis?home=10&away=20&kickoff=${encodeURIComponent(KICKOFF)}`

function createTestApp(options: { analyze?: () => Promise<AnalysisResponse>; fixtures?: Fixture[] } = {}) {
  const analyze = vi.fn(options.analyze ?? (async () => ({}) as AnalysisResponse))
  const teamForm = vi.fn(async () => ({}) as TeamAnalysis)
  const matchesOfDay = vi.fn(async () => ({ date: '2026-10-25', competitions: [], unavailable: [] }) as MatchdayResponse)
  const getSeasonFixtures = vi.fn(async () => ({ season: CURRENT_SEASON, fixtures: options.fixtures ?? [] }))
  const football = buildFootballStub({ searchTeams: vi.fn(async () => []), getSeasonFixtures })
  const app = createApp({ football, analysis: { analyze, teamForm }, matchday: { matchesOfDay }, now: () => NOW })
  return { app, analyze, teamForm, matchesOfDay, football, getSeasonFixtures }
}

describe('team search route', () => {
  it('should_reject_the_search_with_400_when_the_query_has_fewer_than_three_characters', async () => {
    const { app, football } = createTestApp()

    const response = await app.request('/api/teams/search?q=ar')

    expect(response.status).toBe(400)
    expect(football.searchTeams).not.toHaveBeenCalled()
  })

  it('should_search_with_the_trimmed_query_when_it_is_valid', async () => {
    const { app, football } = createTestApp()

    const response = await app.request('/api/teams/search?q=%20Arsenal%20')

    expect(response.status).toBe(200)
    expect(football.searchTeams).toHaveBeenCalledWith('Arsenal')
  })
})

describe('team fixtures route', () => {
  it('should_split_upcoming_soonest_first_and_played_most_recent_first_when_the_calendar_is_mixed', async () => {
    const fixtures = [
      buildFixture({ id: 1, date: '2026-01-01T20:00:00+00:00' }),
      buildFixture({ id: 2, date: '2026-02-01T20:00:00+00:00' }),
      buildFixture({ id: 3, date: '2026-12-01T20:00:00+00:00', status: 'NS' }),
      buildFixture({ id: 4, date: '2026-11-01T20:00:00+00:00', status: 'NS' }),
      buildFixture({ id: 5, date: '2026-10-01T20:00:00+00:00', status: 'PST' }),
    ]
    const { app, getSeasonFixtures } = createTestApp({ fixtures })

    const response = await app.request('/api/teams/10/fixtures')

    const body = (await response.json()) as TeamFixturesResponse
    expect(body.season).toBe(CURRENT_SEASON)
    expect(body.played.map((fixture) => fixture.fixture.id)).toEqual([2, 1])
    expect(body.upcoming.map((fixture) => fixture.fixture.id)).toEqual([4, 3])
    expect(getSeasonFixtures).toHaveBeenCalledWith(10)
  })

  it('should_reject_the_request_with_400_when_the_team_id_is_not_a_positive_integer', async () => {
    const { app } = createTestApp()

    const response = await app.request('/api/teams/abc/fixtures')

    expect(response.status).toBe(400)
  })
})

describe('matches of the day route', () => {
  it('should_ask_for_the_matches_of_the_current_time', async () => {
    const { app, matchesOfDay } = createTestApp()

    const response = await app.request('/api/matches/today')

    expect(response.status).toBe(200)
    expect(matchesOfDay).toHaveBeenCalledExactlyOnceWith(NOW)
    expect(await response.json()).toEqual({ date: '2026-10-25', competitions: [], unavailable: [] })
  })
})

describe('team form route', () => {
  it('should_ask_for_the_form_as_of_the_current_time_when_the_team_id_is_valid', async () => {
    const { app, teamForm } = createTestApp()

    const response = await app.request('/api/teams/83/form')

    expect(response.status).toBe(200)
    expect(teamForm).toHaveBeenCalledExactlyOnceWith(83, '2026-10-25T12:00:00.000Z')
  })

  it('should_answer_400_when_the_team_id_is_not_a_positive_integer', async () => {
    const { app, teamForm } = createTestApp()

    const response = await app.request('/api/teams/abc/form')

    expect(response.status).toBe(400)
    expect(teamForm).not.toHaveBeenCalled()
  })
})

describe('analysis route', () => {
  it('should_accept_the_espn_date_format_without_seconds_as_kickoff', async () => {
    const { app, analyze } = createTestApp()

    const response = await app.request('/api/analysis?home=10&away=20&kickoff=2026-10-24T14:00Z')

    expect(response.status).toBe(200)
    expect(analyze).toHaveBeenCalledWith(expect.objectContaining({ kickoff: '2026-10-24T14:00Z' }))
  })

  it('should_forward_the_validated_parameters_to_the_service', async () => {
    const { app, analyze } = createTestApp()

    await app.request(ANALYSIS_URL)

    expect(analyze).toHaveBeenCalledExactlyOnceWith({
      homeTeamId: 10,
      awayTeamId: 20,
      kickoff: KICKOFF,
    })
  })

  it.each([
    ['a missing team', `/api/analysis?home=10&kickoff=${encodeURIComponent(KICKOFF)}`],
    ['a kickoff that is not a date', '/api/analysis?home=10&away=20&kickoff=yesterday'],
    ['a team id that is not a number', `/api/analysis?home=x&away=20&kickoff=${encodeURIComponent(KICKOFF)}`],
  ])('should_answer_400_without_calling_the_service_when_the_request_has_%s', async (_label, url) => {
    const { app, analyze } = createTestApp()

    const response = await app.request(url)

    expect(response.status).toBe(400)
    expect(analyze).not.toHaveBeenCalled()
  })

  it('should_answer_502_with_the_message_when_espn_fails', async () => {
    const { app } = createTestApp({
      analyze: async () => {
        throw new EspnError('ESPN responded with HTTP 500')
      },
    })

    const response = await app.request(ANALYSIS_URL)

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'ESPN responded with HTTP 500' })
  })

  it('should_answer_404_when_a_domain_not_found_error_is_raised', async () => {
    const { app } = createTestApp({
      analyze: async () => {
        throw new NotFoundError('unknown team')
      },
    })

    const response = await app.request(ANALYSIS_URL)

    expect(response.status).toBe(404)
  })

  it('should_answer_500_without_leaking_details_when_an_unexpected_error_happens', async () => {
    const { app } = createTestApp({
      analyze: async () => {
        throw new Error('internal detail')
      },
    })

    const response = await app.request(ANALYSIS_URL)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Internal server error' })
  })
})
