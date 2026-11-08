import type { Fixture, TeamStatistics } from '@futbol/core'
import { createDatabase, IN_MEMORY_DATABASE } from '../db/database.ts'
import type { FootballData } from '../football-data.ts'

export const CURRENT_SEASON = 2026

interface FixtureOverrides {
  id?: number
  homeId?: number
  awayId?: number
  status?: string
  date?: string
  homeGoals?: number | null
  awayGoals?: number | null
  statistics?: TeamStatistics[]
}

export function buildFixture({
  id = 1,
  homeId = 10,
  awayId = 20,
  status = 'FT',
  date = '2026-01-01T20:00:00+00:00',
  homeGoals = 1,
  awayGoals = 0,
  statistics,
}: FixtureOverrides = {}): Fixture {
  return {
    fixture: { id, date, status: { short: status } },
    league: { id: 'eng.1', name: 'English Premier League', season: CURRENT_SEASON },
    teams: {
      home: { id: homeId, name: `Team ${homeId}`, logo: 'home.png' },
      away: { id: awayId, name: `Team ${awayId}`, logo: 'away.png' },
    },
    goals: { home: homeGoals, away: awayGoals },
    statistics,
  }
}

export function createTestDatabase() {
  return createDatabase(IN_MEMORY_DATABASE)
}

/** A `FootballData` where every method resolves to an empty result unless overridden. */
export function buildFootballStub(overrides: Partial<FootballData> = {}): FootballData {
  return {
    searchTeams: async () => [],
    getScoreboard: async () => [],
    getSeasonFixtures: async (_team, season) => ({ season: season ?? CURRENT_SEASON, fixtures: [] }),
    getFixtureDetails: async () => undefined,
    ...overrides,
  }
}

interface EspnEventOverrides {
  id?: number
  date?: string
  homeId?: number
  awayId?: number
  homeScore?: number
  awayScore?: number
  statusName?: string
  statusState?: string
}

/** A calendar event shaped like ESPN's `/teams/{id}/schedule` payload (only the fields the app reads). */
export function espnScheduleEvent({
  id = 1,
  date = '2026-01-01T20:00Z',
  homeId = 10,
  awayId = 20,
  homeScore,
  awayScore,
  statusName = 'STATUS_FULL_TIME',
  statusState = 'post',
}: EspnEventOverrides = {}) {
  const competitor = (homeAway: 'home' | 'away', teamId: number, score?: number) => ({
    homeAway,
    team: { id: String(teamId), displayName: `Team ${teamId}` },
    ...(score === undefined ? {} : { score: { value: score } }),
  })
  return {
    id: String(id),
    date,
    season: { year: CURRENT_SEASON },
    league: { slug: 'eng.1', name: 'English Premier League' },
    competitions: [
      {
        status: { type: { name: statusName, state: statusState } },
        competitors: [competitor('home', homeId, homeScore), competitor('away', awayId, awayScore)],
      },
    ],
  }
}

export function espnSchedule(events: ReturnType<typeof espnScheduleEvent>[], seasonYear = CURRENT_SEASON) {
  return { season: { year: seasonYear }, events }
}

interface EspnSummaryOverrides {
  homeId?: number
  awayId?: number
  homeScore?: string
  awayScore?: string
  homeStatistics?: Record<string, string>
  awayStatistics?: Record<string, string>
  statusName?: string
  statusState?: string
}

/** A match summary shaped like ESPN's `/summary?event=` payload (only the fields the app reads). */
export function espnSummary({
  homeId = 10,
  awayId = 20,
  homeScore = '2',
  awayScore = '1',
  homeStatistics = { wonCorners: '6', totalShots: '12', shotsOnTarget: '5', saves: '2', yellowCards: '1', redCards: '0' },
  awayStatistics = { wonCorners: '3', totalShots: '8', shotsOnTarget: '2', saves: '4', yellowCards: '2', redCards: '0' },
  statusName = 'STATUS_FULL_TIME',
  statusState = 'post',
}: EspnSummaryOverrides = {}) {
  const toStatistics = (values: Record<string, string>) =>
    Object.entries(values).map(([name, displayValue]) => ({ name, displayValue }))
  return {
    header: {
      league: { slug: 'eng.1', name: 'English Premier League' },
      season: { year: CURRENT_SEASON },
      competitions: [
        {
          date: '2026-01-01T20:00Z',
          status: { type: { name: statusName, state: statusState } },
          competitors: [
            { homeAway: 'home', score: homeScore, team: { id: String(homeId), displayName: `Team ${homeId}` } },
            { homeAway: 'away', score: awayScore, team: { id: String(awayId), displayName: `Team ${awayId}` } },
          ],
        },
      ],
    },
    boxscore: {
      teams: [
        { team: { id: String(homeId) }, statistics: toStatistics(homeStatistics) },
        { team: { id: String(awayId) }, statistics: toStatistics(awayStatistics) },
      ],
    },
  }
}

interface EspnScoreboardEventOverrides {
  id?: number
  date?: string
  homeId?: number
  awayId?: number
  homeScore?: string
  awayScore?: string
  statusName?: string
  statusState?: string
}

/** A scoreboard event shaped like ESPN's `/scoreboard` payload (scores are strings, the logo sits on the team). */
export function espnScoreboardEvent({
  id = 1,
  date = '2026-10-25T18:00Z',
  homeId = 10,
  awayId = 20,
  homeScore = '2',
  awayScore = '1',
  statusName = 'STATUS_FULL_TIME',
  statusState = 'post',
}: EspnScoreboardEventOverrides = {}) {
  const competitor = (homeAway: 'home' | 'away', teamId: number, score: string) => ({
    homeAway,
    score,
    team: { id: String(teamId), displayName: `Team ${teamId}`, logo: `https://logos.test/${teamId}.png` },
  })
  return {
    id: String(id),
    date,
    season: { year: CURRENT_SEASON },
    competitions: [
      {
        status: { type: { name: statusName, state: statusState } },
        competitors: [competitor('home', homeId, homeScore), competitor('away', awayId, awayScore)],
      },
    ],
  }
}

export function espnScoreboard(events: ReturnType<typeof espnScoreboardEvent>[], slug = 'eng.1', name = 'English Premier League') {
  return { leagues: [{ slug, name }], events }
}
