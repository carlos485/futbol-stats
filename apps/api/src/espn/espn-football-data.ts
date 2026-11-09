import { fixtureSchema, teamSchema, type Fixture, type Team, type TeamColors } from '@futbol/core'
import { z } from 'zod'
import { NEVER_EXPIRES, type CacheStore } from '../cache/cache-store.ts'
import { NotFoundError } from '../errors.ts'
import { isFinished } from '../fixture-selection.ts'
import type { FootballData, SeasonFixtures } from '../football-data.ts'
import { logger } from '../logger.ts'
import type { EspnSource } from './espn-client.ts'
import {
  scheduleEventToFixture,
  scoreboardToFixtures,
  searchItemToTeam,
  summaryToFixture,
  teamDetailToColors,
} from './espn-mappers.ts'
import { scheduleSchema, scoreboardSchema, searchSchema, summarySchema, teamDetailSchema } from './espn-schemas.ts'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

const CacheTtl = {
  teamSearch: 30 * MS_PER_DAY,
  // The current calendar changes after every matchday; past seasons never do.
  currentSeason: MS_PER_HOUR,
  pastSeason: 30 * MS_PER_DAY,
  // Scoreboards carry live scores, so they are kept only briefly.
  scoreboard: MS_PER_MINUTE,
  // Brand colors almost never change.
  teamColors: 30 * MS_PER_DAY,
} as const

const SEARCH_RESULTS_LIMIT = 10
const UPCOMING_QUERY = 'fixture=true'
// ESPN accepts `all` as the league of a team calendar, which lists every competition the team plays.
const ALL_COMPETITIONS = 'all'

export interface EspnUrls {
  siteApiUrl: string
  searchApiUrl: string
}

const teamColorsSchema = z.object({ primary: z.string(), alternate: z.string() }).nullable()
const seasonFixturesSchema = z.object({ season: z.number(), fixtures: z.array(fixtureSchema) })

export class EspnFootballData implements FootballData {
  constructor(
    private readonly source: EspnSource,
    private readonly cache: CacheStore,
    private readonly urls: EspnUrls,
  ) {}

  searchTeams(query: string): Promise<Team[]> {
    const search = query.trim().toLowerCase()
    const params = new URLSearchParams({ query: search, limit: String(SEARCH_RESULTS_LIMIT), type: 'team' })
    return this.cached(`espn:search:${search}`, z.array(teamSchema), CacheTtl.teamSearch, async () => {
      const result = await this.source.get(`${this.urls.searchApiUrl}?${params}`, searchSchema)
      return result.items.flatMap((item) => searchItemToTeam(item) ?? [])
    })
  }

  getSeasonFixtures(teamId: number, season?: number): Promise<SeasonFixtures> {
    if (season === undefined) {
      return this.cached(this.calendarKey(teamId, 'current'), seasonFixturesSchema, CacheTtl.currentSeason, () =>
        this.loadCurrentSeason(teamId),
      )
    }
    return this.cached(this.calendarKey(teamId, String(season)), seasonFixturesSchema, CacheTtl.pastSeason, () =>
      this.loadPastSeason(teamId, season),
    )
  }

  getScoreboard(competitionId: string, espnDate: string): Promise<Fixture[]> {
    return this.cached(`espn:scoreboard:${competitionId}:${espnDate}`, z.array(fixtureSchema), CacheTtl.scoreboard, async () => {
      const url = `${this.leagueUrl(competitionId)}/scoreboard?dates=${espnDate}`
      return scoreboardToFixtures(await this.source.get(url, scoreboardSchema))
    })
  }

  getTeamColors(teamId: number): Promise<TeamColors | null> {
    return this.cached(`espn:team-colors:${teamId}`, teamColorsSchema, CacheTtl.teamColors, async () => {
      const detail = await this.source.get(`${this.leagueUrl(ALL_COMPETITIONS)}/teams/${teamId}`, teamDetailSchema)
      return teamDetailToColors(detail)
    })
  }

  /** Finished matches never change, so their summary is cached forever. */
  async getFixtureDetails(leagueId: string, fixtureId: number): Promise<Fixture | undefined> {
    const key = `espn:summary:${leagueId}:${fixtureId}`
    const cached = this.cache.get(key, fixtureSchema)
    if (cached) {
      logger.info(`[cache] hit ${key}`)
      return cached
    }

    const fixture = await this.loadSummary(leagueId, fixtureId)
    if (fixture && isFinished(fixture)) {
      this.cache.set(key, fixture, NEVER_EXPIRES)
    }
    return fixture
  }

  private async loadSummary(leagueId: string, fixtureId: number): Promise<Fixture | undefined> {
    try {
      const summary = await this.source.get(
        `${this.leagueUrl(leagueId)}/summary?event=${fixtureId}`,
        summarySchema,
      )
      return summaryToFixture(summary, fixtureId)
    } catch (error) {
      // A match ESPN does not know simply has no extra details; the calendar entry is still usable.
      if (error instanceof NotFoundError) return undefined
      throw error
    }
  }

  private async loadCurrentSeason(teamId: number): Promise<SeasonFixtures> {
    // The default calendar only lists played matches; the pending ones need `fixture=true`.
    const [played, upcoming] = await Promise.all([
      this.source.get(this.scheduleUrl(teamId), scheduleSchema),
      this.source.get(this.scheduleUrl(teamId, UPCOMING_QUERY), scheduleSchema),
    ])
    return { season: played.season.year, fixtures: this.toFixtures([...played.events, ...upcoming.events]) }
  }

  private async loadPastSeason(teamId: number, season: number): Promise<SeasonFixtures> {
    const schedule = await this.source.get(this.scheduleUrl(teamId, `season=${season}`), scheduleSchema)
    return { season, fixtures: this.toFixtures(schedule.events) }
  }

  private toFixtures(events: z.infer<typeof scheduleSchema>['events']): Fixture[] {
    const byId = new Map<number, Fixture>()
    for (const event of events) {
      const fixture = scheduleEventToFixture(event)
      if (fixture) byId.set(fixture.fixture.id, fixture)
    }
    return [...byId.values()]
  }

  private leagueUrl(leagueId: string): string {
    return `${this.urls.siteApiUrl}/${encodeURIComponent(leagueId)}`
  }

  private scheduleUrl(teamId: number, query?: string): string {
    const base = `${this.leagueUrl(ALL_COMPETITIONS)}/teams/${teamId}/schedule`
    return query ? `${base}?${query}` : base
  }

  private calendarKey(teamId: number, seasonLabel: string): string {
    return `espn:calendar:${teamId}:${seasonLabel}`
  }

  private async cached<Schema extends z.ZodType>(
    key: string,
    schema: Schema,
    ttlMs: number,
    load: () => Promise<z.output<Schema>>,
  ): Promise<z.output<Schema>> {
    const hit = this.cache.get(key, schema)
    if (hit !== undefined) {
      logger.info(`[cache] hit ${key}`)
      return hit
    }
    const value = await load()
    this.cache.set(key, value, ttlMs)
    return value
  }
}
