import { describe, expect, it } from 'vitest'
import { addDays, limaDayOf, toEspnDate } from './lima-date.ts'

describe('limaDayOf', () => {
  it('should_use_the_previous_day_when_utc_is_already_the_next_one_but_lima_is_not', () => {
    expect(limaDayOf('2026-10-26T03:00:00Z')).toBe('2026-10-25')
  })

  it('should_keep_the_same_day_when_lima_and_utc_agree', () => {
    expect(limaDayOf('2026-10-25T18:00:00Z')).toBe('2026-10-25')
  })

  it('should_switch_day_exactly_at_midnight_lima_which_is_5_hours_after_utc', () => {
    expect(limaDayOf('2026-10-26T04:59:59Z')).toBe('2026-10-25')
    expect(limaDayOf('2026-10-26T05:00:00Z')).toBe('2026-10-26')
  })

  it('should_understand_the_dates_espn_sends_without_seconds', () => {
    expect(limaDayOf('2026-10-25T00:30Z')).toBe('2026-10-24')
  })

  it('should_accept_a_date_object', () => {
    expect(limaDayOf(new Date('2026-01-01T12:00:00Z'))).toBe('2026-01-01')
  })
})

describe('addDays', () => {
  it('should_cross_month_and_year_boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('toEspnDate', () => {
  it('should_remove_the_dashes', () => {
    expect(toEspnDate('2026-10-25')).toBe('20261025')
  })
})
