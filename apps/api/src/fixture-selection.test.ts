import { describe, expect, it } from 'vitest'
import { RECENT_MATCHES_COUNT, selectPlayed, selectRecentBefore, selectUpcoming } from './fixture-selection.ts'
import { buildFixture } from './testing/builders.ts'

const KICKOFF = '2026-03-01T20:00:00+00:00'

function playedOn(id: number, date: string, status = 'FT') {
  return buildFixture({ id, date: `${date}T20:00:00+00:00`, status })
}

describe('selectPlayed', () => {
  it('should_keep_only_finished_fixtures_when_the_season_includes_pending_ones', () => {
    const fixtures = [playedOn(1, '2026-01-01'), playedOn(2, '2026-01-08', 'NS'), playedOn(3, '2026-01-15', 'PEN')]

    expect(selectPlayed(fixtures).map((fixture) => fixture.fixture.id)).toEqual([3, 1])
  })

  it('should_order_fixtures_from_most_recent_to_oldest_when_they_come_ascending', () => {
    const fixtures = [playedOn(1, '2026-01-01'), playedOn(2, '2026-02-01')]

    expect(selectPlayed(fixtures).map((fixture) => fixture.fixture.id)).toEqual([2, 1])
  })
})

describe('selectUpcoming', () => {
  it('should_keep_only_not_started_fixtures_soonest_first_when_the_calendar_is_mixed', () => {
    const fixtures = [
      playedOn(1, '2026-01-01'),
      playedOn(2, '2026-12-01', 'NS'),
      playedOn(3, '2026-11-01', 'NS'),
      playedOn(4, '2026-10-01', 'PST'),
    ]

    expect(selectUpcoming(fixtures).map((fixture) => fixture.fixture.id)).toEqual([3, 2])
  })
})

describe('selectRecentBefore', () => {
  it('should_exclude_the_kickoff_match_and_later_ones_when_selecting_the_previous_matches', () => {
    const fixtures = [
      playedOn(1, '2026-02-01'),
      buildFixture({ id: 2, date: KICKOFF }),
      playedOn(3, '2026-03-15'),
    ]

    expect(selectRecentBefore(fixtures, KICKOFF).map((fixture) => fixture.fixture.id)).toEqual([1])
  })

  it('should_return_the_five_latest_previous_matches_when_there_are_more', () => {
    const fixtures = Array.from({ length: 8 }, (_, index) => playedOn(index + 1, `2026-02-${String(index + 1).padStart(2, '0')}`))

    const selected = selectRecentBefore(fixtures, KICKOFF)

    expect(selected).toHaveLength(RECENT_MATCHES_COUNT)
    expect(selected.map((fixture) => fixture.fixture.id)).toEqual([8, 7, 6, 5, 4])
  })

  it('should_ignore_unfinished_matches_when_selecting_the_previous_matches', () => {
    const fixtures = [playedOn(1, '2026-02-01', 'PST'), playedOn(2, '2026-02-02')]

    expect(selectRecentBefore(fixtures, KICKOFF).map((fixture) => fixture.fixture.id)).toEqual([2])
  })
})
