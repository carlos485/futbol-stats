import type { LineupPlayer, TeamLineup } from '@futbol/core'
import { describe, expect, it } from 'vitest'
import { layoutLineup } from './lineup-layout'

function lineupOf(formation: string, positions: string[]): TeamLineup {
  const starters: LineupPlayer[] = positions.map((position, index) => ({ name: `P${index + 1}`, jersey: String(index + 1), position }))
  return { formation, starters, substitutes: [] }
}

const FOUR_THREE_THREE = lineupOf('4-3-3', ['G', 'CD-L', 'CD-R', 'LB', 'RB', 'CM', 'LM', 'RM', 'F', 'LF', 'RF'])
// ESPN tags the two holding midfielders of a 4-2-3-1 as LM and RM.
const FOUR_TWO_THREE_ONE = lineupOf('4-2-3-1', ['G', 'CD-L', 'CD-R', 'LB', 'RB', 'AM', 'LM', 'RM', 'F', 'AM-L', 'AM-R'])

function columns(placed: ReturnType<typeof layoutLineup>): string[][] {
  const xs = [...new Set(placed.map((item) => item.x))].sort((a, b) => a - b)
  return xs.map((x) => placed.filter((item) => item.x === x).map((item) => item.player.position))
}

describe('layoutLineup', () => {
  it('should_place_one_goalkeeper_and_lines_with_the_size_of_the_formation_when_the_team_is_home', () => {
    const lines = columns(layoutLineup(FOUR_THREE_THREE, 'home'))

    expect(lines.map((line) => line.length)).toEqual([1, 4, 3, 3])
    expect(lines[0]).toEqual(['G'])
  })

  it('should_follow_the_formation_instead_of_the_position_labels_when_they_are_misleading', () => {
    const lines = columns(layoutLineup(FOUR_TWO_THREE_ONE, 'home'))

    expect(lines.map((line) => line.length)).toEqual([1, 4, 2, 3, 1])
    expect(lines[2]).toEqual(expect.arrayContaining(['LM', 'RM']))
    expect(lines[4]).toEqual(['F'])
  })

  it('should_put_the_left_side_players_above_the_right_side_ones_when_the_team_is_home', () => {
    const placed = layoutLineup(FOUR_THREE_THREE, 'home')
    const yOf = (position: string) => placed.find((item) => item.player.position === position)?.y ?? Number.NaN

    expect(yOf('LB')).toBeLessThan(yOf('CD-L'))
    expect(yOf('CD-L')).toBeLessThan(yOf('CD-R'))
    expect(yOf('CD-R')).toBeLessThan(yOf('RB'))
  })

  it('should_mirror_the_layout_when_the_team_is_away', () => {
    const home = layoutLineup(FOUR_THREE_THREE, 'home')
    const away = layoutLineup(FOUR_THREE_THREE, 'away')

    home.forEach((item, index) => {
      expect(away[index].player).toBe(item.player)
      expect(away[index].x).toBeCloseTo(100 - item.x)
      expect(away[index].y).toBeCloseTo(100 - item.y)
    })
  })

  it('should_group_players_by_depth_when_the_formation_does_not_match_the_number_of_outfield_players', () => {
    const lineup = lineupOf('4-4-2', ['G', 'CD', 'CD', 'CM', 'F'])

    expect(columns(layoutLineup(lineup, 'home')).map((line) => line.length)).toEqual([1, 2, 1, 1])
  })
})
