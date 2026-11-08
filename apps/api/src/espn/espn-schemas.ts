import { z } from 'zod'

const logosSchema = z.array(z.object({ href: z.string() })).optional()

const statusSchema = z.object({
  type: z.object({
    name: z.string(),
    state: z.string(),
  }),
})

const leagueSchema = z.object({
  slug: z.string(),
  name: z.string(),
})

const homeAwaySchema = z.enum(['home', 'away'])

const scheduleCompetitorSchema = z.object({
  homeAway: homeAwaySchema,
  team: z.object({ id: z.string(), displayName: z.string(), logos: logosSchema }),
  // Matches that have not been played carry no score at all.
  score: z.object({ value: z.number() }).optional(),
})

export const scheduleEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  season: z.object({ year: z.number() }),
  league: leagueSchema,
  competitions: z
    .array(z.object({ status: statusSchema, competitors: z.array(scheduleCompetitorSchema) }))
    .min(1),
})

export const scheduleSchema = z.object({
  /** Current season of the league, whatever season was requested. */
  season: z.object({ year: z.number() }),
  events: z.array(scheduleEventSchema).default([]),
})

const summaryCompetitorSchema = z.object({
  homeAway: homeAwaySchema,
  score: z.string().optional(),
  team: z.object({ id: z.string(), displayName: z.string(), logos: logosSchema }),
})

export const summarySchema = z.object({
  header: z.object({
    league: leagueSchema,
    season: z.object({ year: z.number() }),
    competitions: z
      .array(z.object({ date: z.string(), status: statusSchema, competitors: z.array(summaryCompetitorSchema) }))
      .min(1),
  }),
  boxscore: z
    .object({
      teams: z.array(
        z.object({
          team: z.object({ id: z.string() }),
          statistics: z.array(z.object({ name: z.string(), displayValue: z.string() })).optional(),
        }),
      ),
    })
    .optional(),
})

const scoreboardCompetitorSchema = z.object({
  homeAway: homeAwaySchema,
  score: z.string().optional(),
  team: z.object({ id: z.string(), displayName: z.string(), logo: z.string().optional(), logos: logosSchema }),
})

export const scoreboardSchema = z.object({
  leagues: z.array(leagueSchema).min(1),
  events: z
    .array(
      z.object({
        id: z.string(),
        date: z.string(),
        season: z.object({ year: z.number() }),
        competitions: z.array(z.object({ status: statusSchema, competitors: z.array(scoreboardCompetitorSchema) })).min(1),
      }),
    )
    .default([]),
})

export const searchSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        sport: z.string().optional(),
        league: z.string().optional(),
        displayName: z.string(),
        logos: logosSchema,
      }),
    )
    .default([]),
})

export type ScheduleEvent = z.infer<typeof scheduleEventSchema>
export type Scoreboard = z.infer<typeof scoreboardSchema>
export type Summary = z.infer<typeof summarySchema>
export type SearchItem = z.infer<typeof searchSchema>['items'][number]
