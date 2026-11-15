import { getMatchResult, type MatchResult, type MatchSummary, type TeamAnalysis } from '@futbol/core'
import { formatScore } from './format'

export const FORM_LENGTH = 5

const RESULT_NAMES: Record<MatchResult, string> = { W: 'Victoria', D: 'Empate', L: 'Derrota' }

export interface FormSquare {
  fixtureId: number
  result: MatchResult
  /** Readable summary for the tooltip and screen readers, e.g. "Victoria 2 - 1 en Brighton". */
  description: string
}

/** One match picked out of the recent form, from the team's point of view. */
export interface ResultHighlight {
  fixtureId: number
  result: MatchResult
  score: string
  opponent: string
  /** 'vs' when the team played at home, 'en' when away. */
  venue: 'vs' | 'en'
}

export interface BestAndWorst {
  best: ResultHighlight
  /** `null` when there is only one match, which would be both the best and the worst. */
  worst: ResultHighlight | null
}

function goalDifferenceThenGoals(first: MatchSummary, second: MatchSummary): number {
  const [a, b] = [first.stats, second.stats]
  return (a.goalsFor ?? 0) - (a.goalsAgainst ?? 0) - ((b.goalsFor ?? 0) - (b.goalsAgainst ?? 0)) || (a.goalsFor ?? 0) - (b.goalsFor ?? 0)
}

function toHighlight(match: MatchSummary, teamId: number): ResultHighlight {
  const isHome = match.home.id === teamId
  return {
    fixtureId: match.fixtureId,
    result: getMatchResult(match.stats) ?? 'D',
    score: formatScore(match.stats.goalsFor, match.stats.goalsAgainst),
    opponent: (isHome ? match.away : match.home).name,
    venue: isHome ? 'vs' : 'en',
  }
}

/** The best and the worst result of the recent form: by goal difference, then by goals scored. `null` without played matches. */
export function findBestAndWorst(analysis: TeamAnalysis): BestAndWorst | null {
  const played = analysis.matches.filter((match) => getMatchResult(match.stats) !== null).slice(0, FORM_LENGTH)
  if (played.length === 0) return null
  const sorted = [...played].sort(goalDifferenceThenGoals)
  const best = sorted[sorted.length - 1]
  const worst = sorted[0]
  return {
    best: toHighlight(best, analysis.teamId),
    worst: worst === best ? null : toHighlight(worst, analysis.teamId),
  }
}

/** The recent results of a team, oldest first so the latest match ends up on the right. */
export function buildFormSquares(analysis: TeamAnalysis): FormSquare[] {
  const squares = analysis.matches.flatMap((match) => {
    const result = getMatchResult(match.stats)
    if (result === null) return []
    const isHome = match.home.id === analysis.teamId
    const opponent = isHome ? match.away : match.home
    const score = formatScore(match.stats.goalsFor, match.stats.goalsAgainst)
    return [{ fixtureId: match.fixtureId, result, description: `${RESULT_NAMES[result]} ${score} ${isHome ? 'vs' : 'en'} ${opponent.name}` }]
  })
  return squares.slice(0, FORM_LENGTH).reverse()
}
