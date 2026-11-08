import type { Fixture } from '@futbol/core'
import { formatLimaTime } from './format'

export interface MatchStatus {
  label: string
  /** True while the match is being played, so the UI can make it stand out. */
  live: boolean
}

const FINISHED_LABELS: Record<string, string> = {
  FT: 'Final',
  AET: 'Final (prórroga)',
  PEN: 'Final (penales)',
}

const LIVE_RANK = 0
const UPCOMING_RANK = 1
const OTHER_RANK = 2

function playRank(fixture: Fixture): number {
  const { short } = fixture.fixture.status
  if (short === 'LIVE') return LIVE_RANK
  if (short === 'NS') return UPCOMING_RANK
  return OTHER_RANK
}

/** Live matches first, then the ones yet to start, then finished or postponed; the given order is kept inside each group. */
export function sortLiveFirst(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort((a, b) => playRank(a) - playRank(b))
}

/** What to show in a match list next to the teams: kickoff time, "En vivo" or how it ended. */
export function matchStatus(fixture: Fixture): MatchStatus {
  const { short } = fixture.fixture.status
  if (short === 'LIVE') return { label: 'En vivo', live: true }
  if (short === 'NS') return { label: formatLimaTime(fixture.fixture.date), live: false }
  if (short === 'PST') return { label: 'Pospuesto', live: false }
  return { label: FINISHED_LABELS[short] ?? short, live: false }
}
