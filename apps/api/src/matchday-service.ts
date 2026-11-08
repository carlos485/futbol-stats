import type { Fixture, MatchdayCompetition, MatchdayResponse } from '@futbol/core'
import { HttpError } from './errors.ts'
import type { FootballData } from './football-data.ts'
import { addDays, limaDayOf, toEspnDate } from './lima-date.ts'
import { logger } from './logger.ts'
import { TRACKED_COMPETITIONS, type TrackedCompetition } from './tracked-competitions.ts'

interface LoadedCompetition {
  competition: MatchdayCompetition
  failed: boolean
}

function byKickoff(first: Fixture, second: Fixture): number {
  return Date.parse(first.fixture.date) - Date.parse(second.fixture.date)
}

export class MatchdayService {
  constructor(
    private readonly football: FootballData,
    private readonly competitions: readonly TrackedCompetition[] = TRACKED_COMPETITIONS,
  ) {}

  /** The matches played on the Lima calendar day of `now`, grouped by competition. */
  async matchesOfDay(now: Date): Promise<MatchdayResponse> {
    const day = limaDayOf(now)
    const loaded = await Promise.all(this.competitions.map((competition) => this.loadCompetition(competition, day)))
    return {
      date: day,
      competitions: loaded.map((item) => item.competition),
      unavailable: loaded.filter((item) => item.failed).map((item) => item.competition.name),
    }
  }

  // ESPN groups matches by its own day boundary, which can differ from Lima's by about an hour, so the next
  // ESPN day is requested too and everything is filtered by the Lima day afterwards.
  private async loadCompetition(competition: TrackedCompetition, day: string): Promise<LoadedCompetition> {
    const espnDates = [day, addDays(day, 1)].map(toEspnDate)
    try {
      const scoreboards = await Promise.all(espnDates.map((date) => this.football.getScoreboard(competition.id, date)))
      const unique = new Map(scoreboards.flat().map((fixture) => [fixture.fixture.id, fixture]))
      const fixtures = [...unique.values()].filter((fixture) => limaDayOf(fixture.fixture.date) === day).sort(byKickoff)
      return { competition: { ...competition, fixtures }, failed: false }
    } catch (error) {
      if (!(error instanceof HttpError)) throw error
      logger.warn(`[matchday] could not load ${competition.id}: ${error.message}`)
      return { competition: { ...competition, fixtures: [] }, failed: true }
    }
  }
}
