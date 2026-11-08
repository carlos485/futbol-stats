import type { Fixture, Team } from '@futbol/core'
import { describe, expect, it } from 'vitest'
import { selectPanelTeams } from './panel-teams'

const searched: Team = { team: { id: 1, name: 'Mine', logo: 'mine.png' }, league: { id: 'esp.1' } }

function fixtureBetween(homeId: number, awayId: number): Fixture {
  const team = (id: number) => ({ id, name: `Team ${id}`, logo: `${id}.png` })
  return {
    fixture: { id: 7, date: '2026-10-25T20:00:00Z', status: { short: 'NS' } },
    league: { id: 'esp.1', name: 'LaLiga', season: 2026 },
    teams: { home: team(homeId), away: team(awayId) },
    goals: { home: null, away: null },
  }
}

describe('selectPanelTeams', () => {
  it('should_show_nothing_when_there_is_no_team_and_no_match', () => {
    expect(selectPanelTeams(null, null)).toEqual({ subject: null, rival: null })
  })

  it('should_show_only_the_searched_team_when_no_match_is_chosen', () => {
    expect(selectPanelTeams(searched, null)).toEqual({
      subject: { id: 1, name: 'Mine', logo: 'mine.png' },
      rival: null,
    })
  })

  it.each([
    ['home', fixtureBetween(1, 2)],
    ['away', fixtureBetween(2, 1)],
  ])('should_show_the_opponent_as_rival_when_the_searched_team_plays_%s', (_side, fixture) => {
    expect(selectPanelTeams(searched, fixture).rival).toEqual({ id: 2, name: 'Team 2', logo: '2.png', caption: 'Rival' })
  })

  it('should_show_both_sides_of_the_match_when_it_was_picked_without_searching_a_team', () => {
    const { subject, rival } = selectPanelTeams(null, fixtureBetween(3, 4))

    expect(subject).toEqual({ id: 3, name: 'Team 3', logo: '3.png', caption: 'Local' })
    expect(rival).toEqual({ id: 4, name: 'Team 4', logo: '4.png', caption: 'Visitante' })
  })
})
