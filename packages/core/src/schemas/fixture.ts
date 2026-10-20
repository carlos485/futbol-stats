import { z } from 'zod'
import { fixtureStatisticsSchema } from './statistics.ts'

const fixtureTeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string(),
})

export const fixtureSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    status: z.object({ short: z.string() }),
  }),
  league: z.object({
    /** ESPN slug of the league (e.g. `eng.1`). */
    id: z.string(),
    name: z.string(),
    season: z.number(),
  }),
  teams: z.object({
    home: fixtureTeamSchema,
    away: fixtureTeamSchema,
  }),
  goals: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
  // Only present when the fixture comes from a match summary, not from a team calendar.
  statistics: fixtureStatisticsSchema.optional(),
})

export type Fixture = z.infer<typeof fixtureSchema>
