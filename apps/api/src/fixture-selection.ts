import type { Fixture } from '@futbol/core'

export const RECENT_MATCHES_COUNT = 5

const FINISHED_STATUSES: ReadonlySet<string> = new Set(['FT', 'AET', 'PEN'])
const NOT_STARTED_STATUS = 'NS'

export function isFinished(fixture: Fixture): boolean {
  return FINISHED_STATUSES.has(fixture.fixture.status.short)
}

export function byMostRecentFirst(first: Fixture, second: Fixture): number {
  return Date.parse(second.fixture.date) - Date.parse(first.fixture.date)
}

/** Finished fixtures, most recent first. */
export function selectPlayed(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter(isFinished).sort(byMostRecentFirst)
}

/** Fixtures still to be played, soonest first. */
export function selectUpcoming(fixtures: Fixture[]): Fixture[] {
  return fixtures
    .filter((fixture) => fixture.fixture.status.short === NOT_STARTED_STATUS)
    .sort((first, second) => byMostRecentFirst(second, first))
}

/** The latest played fixtures strictly before `kickoff`, so an analysis never sees the future of its own match. */
export function selectRecentBefore(fixtures: Fixture[], kickoff: string, count = RECENT_MATCHES_COUNT): Fixture[] {
  const kickoffTime = Date.parse(kickoff)
  return selectPlayed(fixtures)
    .filter((fixture) => Date.parse(fixture.fixture.date) < kickoffTime)
    .slice(0, count)
}
