import { describe, expect, it, vi } from 'vitest'
import { EspnError } from './errors.ts'
import { MatchdayService } from './matchday-service.ts'
import { buildFixture, buildFootballStub } from './testing/builders.ts'
import type { TrackedCompetition } from './tracked-competitions.ts'

// 2026-10-25 17:30 in Lima.
const NOW = new Date('2026-10-25T22:30:00Z')
const LIGA: TrackedCompetition = { id: 'esp.1', name: 'LaLiga (España)' }
const COPA: TrackedCompetition = { id: 'uefa.champions', name: 'Champions League' }

const at = (id: number, date: string) => buildFixture({ id, date })

function serviceWith(
  scoreboard: (competitionId: string, espnDate: string) => ReturnType<typeof at>[],
  competitions = [LIGA, COPA],
) {
  const getScoreboard = vi.fn(async (competitionId: string, espnDate: string) => scoreboard(competitionId, espnDate))
  return { service: new MatchdayService(buildFootballStub({ getScoreboard }), competitions), getScoreboard }
}

describe('MatchdayService.matchesOfDay', () => {
  it('should_request_the_lima_day_and_the_next_one_for_every_competition', async () => {
    const { service, getScoreboard } = serviceWith(() => [])

    await service.matchesOfDay(NOW)

    expect(getScoreboard.mock.calls.map(([id, date]) => `${id}:${date}`).sort()).toEqual([
      'esp.1:20261025',
      'esp.1:20261026',
      'uefa.champions:20261025',
      'uefa.champions:20261026',
    ])
  })

  it('should_keep_only_the_matches_of_the_lima_day_when_espn_returns_neighbouring_ones', async () => {
    const { service } = serviceWith((id, date) =>
      id !== 'esp.1'
        ? []
        : date === '20261025'
          ? [at(1, '2026-10-25T15:00Z'), at(2, '2026-10-25T04:30Z')] // 2 is 23:30 of the 24th in Lima
          : [at(3, '2026-10-26T02:30Z'), at(4, '2026-10-26T05:30Z')], // 3 is 21:30 of the 25th, 4 is the 26th
    )

    const result = await service.matchesOfDay(NOW)

    expect(result.date).toBe('2026-10-25')
    expect(result.competitions[0].fixtures.map((fixture) => fixture.fixture.id)).toEqual([1, 3])
  })

  it('should_order_matches_by_kickoff_and_drop_duplicates_returned_on_both_days', async () => {
    const { service } = serviceWith((id) =>
      id === 'esp.1' ? [at(2, '2026-10-25T20:00Z'), at(1, '2026-10-25T13:00Z'), at(2, '2026-10-25T20:00Z')] : [],
    )

    const result = await service.matchesOfDay(NOW)

    expect(result.competitions[0].fixtures.map((fixture) => fixture.fixture.id)).toEqual([1, 2])
  })

  it('should_keep_the_competition_order_and_use_the_display_names', async () => {
    const { service } = serviceWith(() => [])

    const result = await service.matchesOfDay(NOW)

    expect(result.competitions.map((competition) => competition.name)).toEqual(['LaLiga (España)', 'Champions League'])
    expect(result.competitions.every((competition) => competition.fixtures.length === 0)).toBe(true)
    expect(result.unavailable).toEqual([])
  })

  it('should_report_the_competition_that_failed_and_still_return_the_others', async () => {
    const { service } = serviceWith((id) => {
      if (id === 'uefa.champions') throw new EspnError('ESPN responded with HTTP 500')
      return [at(1, '2026-10-25T15:00Z')]
    })

    const result = await service.matchesOfDay(NOW)

    expect(result.unavailable).toEqual(['Champions League'])
    expect(result.competitions[0].fixtures).toHaveLength(1)
    expect(result.competitions[1].fixtures).toEqual([])
  })

  it('should_not_hide_unexpected_errors', async () => {
    const { service } = serviceWith(() => {
      throw new TypeError('bug')
    })

    await expect(service.matchesOfDay(NOW)).rejects.toThrow(TypeError)
  })
})
