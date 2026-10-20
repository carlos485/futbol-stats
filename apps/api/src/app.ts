import type { TeamFixturesResponse } from '@futbol/core'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AnalysisService } from './analysis-service.ts'
import { BadRequestError, HttpError } from './errors.ts'
import { selectPlayed, selectUpcoming } from './fixture-selection.ts'
import type { FootballData } from './football-data.ts'
import { logger } from './logger.ts'

const MIN_SEARCH_LENGTH = 3

const idSchema = z.coerce.number().int().positive()
const searchQuerySchema = z.object({ q: z.string().trim().min(MIN_SEARCH_LENGTH) })
const analysisQuerySchema = z.object({
  home: idSchema,
  away: idSchema,
  // ESPN dates omit the seconds (`2026-10-24T14:00Z`), which strict ISO validation would reject.
  kickoff: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'),
})

export interface AppDependencies {
  football: FootballData
  analysis: Pick<AnalysisService, 'analyze'>
}

function parseOrThrow<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '))
  }
  return parsed.data
}

export function createApp({ football, analysis }: AppDependencies): Hono {
  const app = new Hono()

  app.onError((error, context) => {
    if (error instanceof HttpError) {
      return context.json({ error: error.message }, error.status)
    }
    logger.warn(`[api] unhandled error: ${error.stack ?? error.message}`)
    return context.json({ error: 'Internal server error' }, 500)
  })

  app.get('/api/teams/search', async (context) => {
    const { q } = parseOrThrow(searchQuerySchema, context.req.query())
    return context.json(await football.searchTeams(q))
  })

  app.get('/api/teams/:id/fixtures', async (context) => {
    const teamId = parseOrThrow(idSchema, context.req.param('id'))
    const { season, fixtures } = await football.getSeasonFixtures(teamId)
    const body: TeamFixturesResponse = {
      season,
      upcoming: selectUpcoming(fixtures),
      played: selectPlayed(fixtures),
    }
    return context.json(body)
  })

  app.get('/api/analysis', async (context) => {
    const query = parseOrThrow(analysisQuerySchema, context.req.query())
    const result = await analysis.analyze({
      homeTeamId: query.home,
      awayTeamId: query.away,
      kickoff: query.kickoff,
    })
    return context.json(result)
  })

  return app
}
