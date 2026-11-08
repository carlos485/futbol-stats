const LIMA_TIME_ZONE = 'America/Lima'
const MS_PER_DAY = 24 * 60 * 60 * 1000

// The `en-CA` locale formats dates as `YYYY-MM-DD`, which is the shape the rest of the code relies on.
const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIMA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The calendar day (`YYYY-MM-DD`) an instant falls on in Lima, which does not observe daylight saving. */
export function limaDayOf(instant: Date | string): string {
  return dayFormat.format(new Date(instant))
}

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10)
}

/** ESPN expects dates as `YYYYMMDD`. */
export function toEspnDate(day: string): string {
  return day.replaceAll('-', '')
}
