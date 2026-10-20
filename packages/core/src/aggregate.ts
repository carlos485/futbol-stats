import type { TeamMatchStats } from './team-stats.ts'

export type MatchResult = 'W' | 'D' | 'L'

export interface MetricSummary {
  total: number
  /** `null` when no match has data for the metric. */
  average: number | null
  /** Number of matches that had data for the metric. */
  n: number
}

type MetricExtractor = (match: TeamMatchStats) => number | null

function sumWhenBothPresent(first: number | null, second: number | null): number | null {
  return first === null || second === null ? null : first + second
}

const METRIC_EXTRACTORS = {
  goalsFor: (match) => match.goalsFor,
  goalsAgainst: (match) => match.goalsAgainst,
  goalsTotal: (match) => sumWhenBothPresent(match.goalsFor, match.goalsAgainst),
  cornersFor: (match) => match.cornersFor,
  cornersAgainst: (match) => match.cornersAgainst,
  cornersTotal: (match) => sumWhenBothPresent(match.cornersFor, match.cornersAgainst),
  shotsTotal: (match) => match.shotsTotal,
  shotsOnTarget: (match) => match.shotsOnTarget,
  saves: (match) => match.saves,
  yellowCards: (match) => match.yellowCards,
  redCards: (match) => match.redCards,
} satisfies Record<string, MetricExtractor>

export type MetricKey = keyof typeof METRIC_EXTRACTORS

export interface TeamAggregate {
  matches: number
  /** Results in the same order as the input matches; matches without a final score are skipped. */
  form: MatchResult[]
  metrics: Record<MetricKey, MetricSummary>
}

function summarize(values: (number | null)[]): MetricSummary {
  const available = values.filter((value): value is number => value !== null)
  const total = available.reduce((sum, value) => sum + value, 0)
  return {
    total,
    average: available.length > 0 ? total / available.length : null,
    n: available.length,
  }
}

export function getMatchResult(match: TeamMatchStats): MatchResult | null {
  if (match.goalsFor === null || match.goalsAgainst === null) {
    return null
  }
  if (match.goalsFor === match.goalsAgainst) {
    return 'D'
  }
  return match.goalsFor > match.goalsAgainst ? 'W' : 'L'
}

export function aggregate(matches: TeamMatchStats[]): TeamAggregate {
  const metricKeys = Object.keys(METRIC_EXTRACTORS) as MetricKey[]
  const metrics = Object.fromEntries(
    metricKeys.map((key) => [key, summarize(matches.map(METRIC_EXTRACTORS[key]))]),
  ) as Record<MetricKey, MetricSummary>

  return {
    matches: matches.length,
    form: matches.map(getMatchResult).filter((result): result is MatchResult => result !== null),
    metrics,
  }
}
