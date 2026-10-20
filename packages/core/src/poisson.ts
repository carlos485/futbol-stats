import type { TeamAggregate } from './aggregate.ts'

const MAX_GOALS = 10
const MIN_EXPECTED_GOALS = 0.1
const H2H_WEIGHT = 0.3
const FORM_WEIGHT = 1 - H2H_WEIGHT
const OVER_GOALS_LINE = 2.5

export interface ScoreProbability {
  teamA: number
  teamB: number
  probability: number
}

export interface MatchPrediction {
  expectedGoalsA: number
  expectedGoalsB: number
  teamAWin: number
  draw: number
  teamBWin: number
  mostLikelyScore: ScoreProbability
  overTwoPointFive: number
}

/** Expected goals of a team given its attack and the opponent's defence, both as per-match averages. */
export function expectedGoals(goalsForAverage: number, opponentGoalsAgainstAverage: number): number {
  return (goalsForAverage + opponentGoalsAgainstAverage) / 2
}

/** Mixes the recent-form estimate with the head-to-head goal average (when there is one). */
export function blendExpectedGoals(formExpectedGoals: number, headToHeadAverage: number | null): number {
  const blended =
    headToHeadAverage === null
      ? formExpectedGoals
      : FORM_WEIGHT * formExpectedGoals + H2H_WEIGHT * headToHeadAverage
  return Math.max(blended, MIN_EXPECTED_GOALS)
}

// Iterative form avoids computing large factorials: P(k) = P(k-1) * lambda / k.
function poissonDistribution(lambda: number): number[] {
  const probabilities = [Math.exp(-lambda)]
  for (let goals = 1; goals <= MAX_GOALS; goals++) {
    probabilities.push((probabilities[goals - 1] * lambda) / goals)
  }
  return probabilities
}

export function predictMatch(lambdaA: number, lambdaB: number): MatchPrediction {
  const distributionA = poissonDistribution(Math.max(lambdaA, MIN_EXPECTED_GOALS))
  const distributionB = poissonDistribution(Math.max(lambdaB, MIN_EXPECTED_GOALS))

  let teamAWin = 0
  let draw = 0
  let teamBWin = 0
  let overLine = 0
  let mostLikelyScore: ScoreProbability = { teamA: 0, teamB: 0, probability: 0 }

  for (let goalsA = 0; goalsA <= MAX_GOALS; goalsA++) {
    for (let goalsB = 0; goalsB <= MAX_GOALS; goalsB++) {
      const probability = distributionA[goalsA] * distributionB[goalsB]
      if (goalsA > goalsB) teamAWin += probability
      else if (goalsA === goalsB) draw += probability
      else teamBWin += probability
      if (goalsA + goalsB > OVER_GOALS_LINE) overLine += probability
      if (probability > mostLikelyScore.probability) {
        mostLikelyScore = { teamA: goalsA, teamB: goalsB, probability }
      }
    }
  }

  // The matrix is truncated at MAX_GOALS, so rescale to make the outcomes add up to exactly 1.
  const total = teamAWin + draw + teamBWin
  return {
    expectedGoalsA: lambdaA,
    expectedGoalsB: lambdaB,
    teamAWin: teamAWin / total,
    draw: draw / total,
    teamBWin: teamBWin / total,
    mostLikelyScore: { ...mostLikelyScore, probability: mostLikelyScore.probability / total },
    overTwoPointFive: overLine / total,
  }
}

/**
 * Predicts the match from the last-5 aggregates of each team.
 * `headToHead` is the aggregate of the head-to-head matches from team A's point of view.
 * Returns `null` when either team has no goal data.
 */
export function predictFromAggregates(
  teamA: TeamAggregate,
  teamB: TeamAggregate,
  headToHead?: TeamAggregate,
): MatchPrediction | null {
  const goalsForA = teamA.metrics.goalsFor.average
  const goalsAgainstA = teamA.metrics.goalsAgainst.average
  const goalsForB = teamB.metrics.goalsFor.average
  const goalsAgainstB = teamB.metrics.goalsAgainst.average
  if (goalsForA === null || goalsAgainstA === null || goalsForB === null || goalsAgainstB === null) {
    return null
  }

  const lambdaA = blendExpectedGoals(
    expectedGoals(goalsForA, goalsAgainstB),
    headToHead?.metrics.goalsFor.average ?? null,
  )
  const lambdaB = blendExpectedGoals(
    expectedGoals(goalsForB, goalsAgainstA),
    headToHead?.metrics.goalsAgainst.average ?? null,
  )
  return predictMatch(lambdaA, lambdaB)
}
