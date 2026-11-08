import type { MetricSummary, TeamMatchStats } from '@futbol/core'

export const NOT_AVAILABLE = 'N/D'

const LIMA_TIME_ZONE = 'America/Lima'
const LOCALE = 'es-PE'
const AVERAGE_DECIMALS = 1
const PERCENT_DECIMALS = 1
const PERCENT_FACTOR = 100

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: LIMA_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: LIMA_TIME_ZONE, dateStyle: 'medium' })

const timeFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: LIMA_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false })

const longDayFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: LIMA_TIME_ZONE, dateStyle: 'full' })

export function formatLimaDateTime(isoDate: string): string {
  return dateTimeFormat.format(new Date(isoDate))
}

export function formatLimaDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate))
}

export function formatLimaTime(isoDate: string): string {
  return timeFormat.format(new Date(isoDate))
}

/** A `YYYY-MM-DD` Lima day as a long date, e.g. "domingo, 25 de octubre de 2026". */
export function formatLimaDay(day: string): string {
  // Noon UTC is 07:00 in Lima, so it stays on the same calendar day.
  return longDayFormat.format(new Date(`${day}T12:00:00Z`))
}

export function formatCount(value: number | null): string {
  return value === null ? NOT_AVAILABLE : String(value)
}

export function formatAverage(summary: MetricSummary): string {
  return summary.average === null ? NOT_AVAILABLE : summary.average.toFixed(AVERAGE_DECIMALS)
}

/** Shares are expressed as 0..1 by the model and shown as percentages. */
export function formatShare(share: number): string {
  return `${(share * PERCENT_FACTOR).toFixed(PERCENT_DECIMALS)}%`
}

export function formatCorners(stats: TeamMatchStats): string {
  const total = stats.cornersFor === null || stats.cornersAgainst === null ? null : stats.cornersFor + stats.cornersAgainst
  return `${formatCount(stats.cornersFor)} / ${formatCount(total)}`
}

export function formatScore(goalsFor: number | null, goalsAgainst: number | null): string {
  return goalsFor === null || goalsAgainst === null ? NOT_AVAILABLE : `${goalsFor} - ${goalsAgainst}`
}
