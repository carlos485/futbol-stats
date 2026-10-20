import type { MetricKey } from '@futbol/core'

export interface ComparisonMetric {
  key: MetricKey
  label: string
  /** Whether the metric is also drawn in the bar chart (the ones with comparable scales). */
  inChart: boolean
}

export const COMPARISON_METRICS: ComparisonMetric[] = [
  { key: 'goalsFor', label: 'Goles a favor', inChart: true },
  { key: 'goalsAgainst', label: 'Goles en contra', inChart: true },
  { key: 'goalsTotal', label: 'Goles totales del partido', inChart: false },
  { key: 'cornersFor', label: 'Córners a favor', inChart: true },
  { key: 'cornersAgainst', label: 'Córners en contra', inChart: false },
  { key: 'cornersTotal', label: 'Córners totales del partido', inChart: false },
  { key: 'shotsTotal', label: 'Tiros', inChart: false },
  { key: 'shotsOnTarget', label: 'Tiros al arco', inChart: true },
  { key: 'saves', label: 'Atajadas', inChart: true },
  { key: 'yellowCards', label: 'Amarillas', inChart: true },
  { key: 'redCards', label: 'Rojas', inChart: false },
]
