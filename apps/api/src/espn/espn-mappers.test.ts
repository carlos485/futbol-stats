import { StatisticType } from '@futbol/core'
import { describe, expect, it } from 'vitest'
import { espnScheduleEvent, espnScoreboard, espnScoreboardEvent, espnSummary } from '../testing/builders.ts'
import { isFriendlyLeague, scheduleEventToFixture, scoreboardToFixtures, searchItemToTeam, summaryToFixture, teamDetailToColors, toStatusCode } from './espn-mappers.ts'
import { scheduleEventSchema, scoreboardSchema, searchSchema, summarySchema } from './espn-schemas.ts'

describe('toStatusCode', () => {
  it.each([
    ['STATUS_FULL_TIME', 'post', 'FT'],
    ['STATUS_FINAL_AET', 'post', 'AET'],
    ['STATUS_FINAL_PEN', 'post', 'PEN'],
    ['STATUS_SCHEDULED', 'pre', 'NS'],
    ['STATUS_POSTPONED', 'post', 'PST'],
  ])('should_map_%s_to_%s_when_the_status_is_known', (name, state, expected) => {
    expect(toStatusCode({ type: { name, state } })).toBe(expected)
  })

  it('should_treat_unknown_statuses_by_their_state_when_espn_adds_new_names', () => {
    expect(toStatusCode({ type: { name: 'STATUS_NEW_PRE', state: 'pre' } })).toBe('NS')
    expect(toStatusCode({ type: { name: 'STATUS_NEW_LIVE', state: 'in' } })).toBe('LIVE')
    expect(toStatusCode({ type: { name: 'STATUS_ABANDONED', state: 'post' } })).toBe('STATUS_ABANDONED')
  })
})

describe('scheduleEventToFixture', () => {
  it('should_map_a_played_match_with_its_goals_and_league_when_the_event_has_scores', () => {
    const event = scheduleEventSchema.parse(espnScheduleEvent({ id: 77, homeId: 359, awayId: 364, homeScore: 3, awayScore: 1 }))

    const fixture = scheduleEventToFixture(event)

    expect(fixture).toMatchObject({
      fixture: { id: 77, status: { short: 'FT' } },
      league: { id: 'eng.1', name: 'English Premier League', season: 2026 },
      teams: { home: { id: 359, name: 'Team 359' }, away: { id: 364, name: 'Team 364' } },
      goals: { home: 3, away: 1 },
    })
  })

  it('should_leave_goals_null_when_the_match_has_not_been_played', () => {
    const event = scheduleEventSchema.parse(
      espnScheduleEvent({ statusName: 'STATUS_SCHEDULED', statusState: 'pre' }),
    )

    expect(scheduleEventToFixture(event)?.goals).toEqual({ home: null, away: null })
  })

  it('should_build_the_default_logo_url_when_espn_sends_no_logos', () => {
    const event = scheduleEventSchema.parse(espnScheduleEvent({ homeId: 359 }))

    expect(scheduleEventToFixture(event)?.teams.home.logo).toBe('https://a.espncdn.com/i/teamlogos/soccer/500/359.png')
  })

  it('should_skip_the_event_when_it_has_no_home_or_away_side', () => {
    const raw = espnScheduleEvent()
    raw.competitions[0].competitors = raw.competitions[0].competitors.slice(0, 1)

    expect(scheduleEventToFixture(scheduleEventSchema.parse(raw))).toBeUndefined()
  })
})

describe('scoreboardToFixtures', () => {
  const parse = (events: ReturnType<typeof espnScoreboardEvent>[]) => scoreboardToFixtures(scoreboardSchema.parse(espnScoreboard(events, 'per.1', 'Peruvian Liga 1')))

  it('should_map_a_finished_match_with_the_competition_of_the_scoreboard', () => {
    const [fixture] = parse([espnScoreboardEvent({ id: 9, homeId: 30, awayId: 40, homeScore: '3', awayScore: '0' })])

    expect(fixture).toMatchObject({
      fixture: { id: 9, status: { short: 'FT' } },
      league: { id: 'per.1', name: 'Peruvian Liga 1', season: 2026 },
      teams: { home: { id: 30, logo: 'https://logos.test/30.png' }, away: { id: 40 } },
      goals: { home: 3, away: 0 },
    })
  })

  it('should_report_a_match_in_play_as_live_with_its_current_score', () => {
    const [fixture] = parse([espnScoreboardEvent({ statusName: 'STATUS_SECOND_HALF', statusState: 'in', homeScore: '1', awayScore: '1' })])

    expect(fixture.fixture.status.short).toBe('LIVE')
    expect(fixture.goals).toEqual({ home: 1, away: 1 })
  })

  it('should_ignore_the_placeholder_score_when_the_match_has_not_started', () => {
    const [fixture] = parse([espnScoreboardEvent({ statusName: 'STATUS_SCHEDULED', statusState: 'pre', homeScore: '0', awayScore: '0' })])

    expect(fixture.fixture.status.short).toBe('NS')
    expect(fixture.goals).toEqual({ home: null, away: null })
  })

  it('should_return_nothing_when_the_scoreboard_has_no_matches', () => {
    expect(parse([])).toEqual([])
  })
})

describe('friendlies', () => {
  it.each([
    ['club.friendly', true],
    ['friendly.emirates_cup', true],
    ['uefa.champions', false],
    ['esp.joan_gamper', false],
  ])('should_classify_%s_as_friendly_%s', (slug, expected) => {
    expect(isFriendlyLeague(slug)).toBe(expected)
  })
})

describe('summaryToFixture', () => {
  it('should_translate_espn_statistics_into_the_names_the_analysis_expects', () => {
    const summary = summarySchema.parse(espnSummary({ homeId: 10, awayId: 20 }))

    const fixture = summaryToFixture(summary, 55)

    expect(fixture?.goals).toEqual({ home: 2, away: 1 })
    const home = fixture?.statistics?.find((entry) => entry.team.id === 10)
    expect(home?.statistics).toEqual(
      expect.arrayContaining([
        { type: StatisticType.CornerKicks, value: 6 },
        { type: StatisticType.TotalShots, value: 12 },
        { type: StatisticType.ShotsOnGoal, value: 5 },
        { type: StatisticType.GoalkeeperSaves, value: 2 },
        { type: StatisticType.YellowCards, value: 1 },
        { type: StatisticType.RedCards, value: 0 },
      ]),
    )
  })

  it('should_ignore_statistics_the_analysis_does_not_use_when_the_box_score_has_many', () => {
    const summary = summarySchema.parse(espnSummary({ homeStatistics: { wonCorners: '4', possessionPct: '64.5' } }))

    const home = summaryToFixture(summary, 55)?.statistics?.find((entry) => entry.team.id === 10)

    expect(home?.statistics).toEqual([{ type: StatisticType.CornerKicks, value: 4 }])
  })

  it('should_leave_statistics_undefined_when_the_box_score_has_none_of_the_known_ones', () => {
    const summary = summarySchema.parse(espnSummary({ homeStatistics: {}, awayStatistics: {} }))

    expect(summaryToFixture(summary, 55)?.statistics).toBeUndefined()
  })

  it('should_leave_goals_null_when_the_match_has_no_score_yet', () => {
    const summary = summarySchema.parse(
      espnSummary({ homeScore: '', awayScore: '', homeStatistics: {}, awayStatistics: {}, statusName: 'STATUS_SCHEDULED', statusState: 'pre' }),
    )

    const fixture = summaryToFixture(summary, 55)

    expect(fixture?.goals).toEqual({ home: null, away: null })
    expect(fixture?.fixture.status.short).toBe('NS')
  })
})

describe('teamDetailToColors', () => {
  it('should_use_the_primary_color_as_alternate_when_espn_has_no_alternate', () => {
    expect(teamDetailToColors({ team: { color: '288A00' } })).toEqual({ primary: '#288A00', alternate: '#288A00' })
  })

  it('should_return_null_when_espn_has_no_primary_color', () => {
    expect(teamDetailToColors({ team: { alternateColor: 'FCE38A' } })).toBeNull()
  })
})

describe('searchItemToTeam', () => {
  const parseItem = (item: object) => searchSchema.parse({ items: [item] }).items[0]

  it('should_keep_soccer_teams_with_their_league_slug', () => {
    const item = parseItem({ id: '359', type: 'team', sport: 'soccer', league: 'eng.1', displayName: 'Arsenal' })

    expect(searchItemToTeam(item)).toEqual({
      team: { id: 359, name: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
      league: { id: 'eng.1' },
    })
  })

  it.each([
    ['friendlies pseudo league', { id: '1', type: 'team', sport: 'soccer', league: 'club.friendly', displayName: 'Arsenal Ceska Lipa' }],
    ['another sport', { id: '2', type: 'team', sport: 'basketball', league: 'nba', displayName: 'Arsenal' }],
    ['non team result', { id: '3', type: 'player', sport: 'soccer', league: 'eng.1', displayName: 'Arsenal Fan' }],
    ['unknown league', { id: '4', type: 'team', sport: 'soccer', displayName: 'Arsenal' }],
  ])('should_drop_the_result_when_it_is_a_%s', (_label, item) => {
    expect(searchItemToTeam(parseItem(item))).toBeUndefined()
  })
})
