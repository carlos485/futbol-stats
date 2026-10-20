import { z } from 'zod'

export const teamSchema = z.object({
  team: z.object({
    id: z.number(),
    name: z.string(),
    logo: z.string(),
  }),
  /** ESPN slug of the league the team plays in (e.g. `eng.1`); calendars are looked up per league. */
  league: z.object({ id: z.string() }),
})

export type Team = z.infer<typeof teamSchema>
