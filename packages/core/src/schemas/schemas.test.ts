import { describe, expect, it } from 'vitest'
import { buildFixture } from '../testing/fixtures.ts'
import { fixtureSchema } from './fixture.ts'
import { teamSchema } from './team.ts'

describe('schemas', () => {
  it('should_parse_a_fixture_without_statistics_when_it_comes_from_a_calendar', () => {
    const parsed = fixtureSchema.parse(buildFixture())

    expect(parsed.statistics).toBeUndefined()
  })

  it('should_keep_the_goals_null_when_the_match_has_not_been_played', () => {
    const parsed = fixtureSchema.parse(buildFixture({ homeGoals: null, awayGoals: null }))

    expect(parsed.goals).toEqual({ home: null, away: null })
  })

  it('should_reject_a_fixture_when_the_league_slug_is_missing', () => {
    const { league: _league, ...withoutLeague } = buildFixture()

    expect(fixtureSchema.safeParse(withoutLeague).success).toBe(false)
  })

  it('should_parse_a_team_with_its_league_slug', () => {
    const parsed = teamSchema.parse({ team: { id: 359, name: 'Arsenal', logo: 'a.png' }, league: { id: 'eng.1' } })

    expect(parsed.league.id).toBe('eng.1')
  })
})
