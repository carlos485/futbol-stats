import type { Fixture } from '@futbol/core'
import { describe, expect, it } from 'vitest'
import { matchStatus, sortLiveFirst } from './fixture-status'

function fixtureWith(short: string, date = '2026-10-25T23:00:00Z', id = 1): Fixture {
  return {
    fixture: { id, date, status: { short } },
    league: { id: 'per.1', name: 'Liga 1', season: 2026 },
    teams: {
      home: { id: 1, name: 'Home', logo: 'h.png' },
      away: { id: 2, name: 'Away', logo: 'a.png' },
    },
    goals: { home: null, away: null },
  }
}

describe('sortLiveFirst', () => {
  it('should_put_live_first_then_upcoming_and_finished_last_when_the_list_is_mixed', () => {
    const finished = fixtureWith('FT', '2026-10-25T14:00:00Z', 1)
    const upcoming = fixtureWith('NS', '2026-10-25T22:00:00Z', 2)
    const live = fixtureWith('LIVE', '2026-10-25T18:00:00Z', 3)

    const sorted = sortLiveFirst([finished, upcoming, live])

    expect(sorted.map((item) => item.fixture.id)).toEqual([3, 2, 1])
  })

  it('should_keep_the_given_order_when_matches_share_the_same_state', () => {
    const first = fixtureWith('NS', '2026-10-25T20:00:00Z', 1)
    const second = fixtureWith('NS', '2026-10-25T22:00:00Z', 2)

    expect(sortLiveFirst([first, second]).map((item) => item.fixture.id)).toEqual([1, 2])
  })
})

describe('matchStatus', () => {
  it('should_show_the_lima_kickoff_time_when_the_match_has_not_started', () => {
    expect(matchStatus(fixtureWith('NS'))).toEqual({ label: '18:00', live: false })
  })

  it('should_flag_the_match_as_live_while_it_is_being_played', () => {
    expect(matchStatus(fixtureWith('LIVE'))).toEqual({ label: 'En vivo', live: true })
  })

  it.each([
    ['FT', 'Final'],
    ['AET', 'Final (prórroga)'],
    ['PEN', 'Final (penales)'],
    ['PST', 'Pospuesto'],
  ])('should_label_%s_as_%s', (short, label) => {
    expect(matchStatus(fixtureWith(short))).toEqual({ label, live: false })
  })

  it('should_fall_back_to_the_raw_status_when_it_is_unknown', () => {
    expect(matchStatus(fixtureWith('STATUS_ABANDONED')).label).toBe('STATUS_ABANDONED')
  })
})
