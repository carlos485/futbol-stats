import { z } from 'zod'

const statisticValueSchema = z.union([z.number(), z.string()]).nullable()

export const fixtureStatisticsSchema = z.array(
  z.object({
    team: z.object({
      id: z.number(),
      name: z.string(),
    }),
    statistics: z.array(
      z.object({
        type: z.string(),
        value: statisticValueSchema,
      }),
    ),
  }),
)

export type FixtureStatistics = z.infer<typeof fixtureStatisticsSchema>
export type TeamStatistics = FixtureStatistics[number]
