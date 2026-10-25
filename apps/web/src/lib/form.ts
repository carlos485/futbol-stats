import { getMatchResult, type MatchResult, type TeamAnalysis } from '@futbol/core'
import { formatScore } from './format'

export const FORM_LENGTH = 5

const RESULT_NAMES: Record<MatchResult, string> = { W: 'Victoria', D: 'Empate', L: 'Derrota' }

export interface FormSquare {
  fixtureId: number
  result: MatchResult
  /** Readable summary for the tooltip and screen readers, e.g. "Victoria 2 - 1 en Brighton". */
  description: string
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
