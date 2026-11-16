import type { LineupPlayer, TeamLineup } from '@futbol/core'

export type PitchSide = 'home' | 'away'

export interface PlacedPlayer {
  player: LineupPlayer
  /** Horizontal position on the pitch, 0 to 100 (left to right). */
  x: number
  /** Vertical position on the pitch, 0 to 100 (top to bottom). */
  y: number
}

const GOALKEEPER = 'G'
const GOALKEEPER_X = 6
// The outfield lines are spread between the goalkeeper and the halfway line.
const FIELD_DEPTH = 38
const PITCH_SIZE = 100
const CENTER = 50

const DEFENSE_DEPTH = 1
const MIDFIELD_DEPTH = 2
const ATTACKING_MIDFIELD_DEPTH = 3
const FORWARD_DEPTH = 4

const DEFENDER = /^(CD|LB|RB|SW)/
const ATTACKING_MIDFIELDER = /^AM/
const FORWARD = /^(F|LF|RF|CF|ST|SS)(-|$)/
const WIDE_LEFT = /^(LB|LM|LF)$/
const WIDE_RIGHT = /^(RB|RM|RF)$/
const LEFT_OF_CENTRE = /-L$/
const RIGHT_OF_CENTRE = /-R$/
const WIDE = 2
const HALF_WIDE = 1

// ESPN's position labels are not reliable on their own (in a 4-2-3-1 the two holding midfielders are tagged LM and RM),
// so they only order the players by depth; the formation decides how many players each line has.
function depthOf(position: string): number {
  if (DEFENDER.test(position)) return DEFENSE_DEPTH
  if (ATTACKING_MIDFIELDER.test(position)) return ATTACKING_MIDFIELD_DEPTH
  if (FORWARD.test(position)) return FORWARD_DEPTH
  return MIDFIELD_DEPTH
}

/** From the team's far left (negative) to its far right (positive); 0 for the centre. */
function lateralOf(position: string): number {
  if (WIDE_LEFT.test(position)) return -WIDE
  if (WIDE_RIGHT.test(position)) return WIDE
  if (LEFT_OF_CENTRE.test(position)) return -HALF_WIDE
  return RIGHT_OF_CENTRE.test(position) ? HALF_WIDE : 0
}

function groupByDepth(sortedByDepth: LineupPlayer[]): LineupPlayer[][] {
  const depths = [...new Set(sortedByDepth.map((player) => depthOf(player.position)))]
  return depths.map((depth) => sortedByDepth.filter((player) => depthOf(player.position) === depth))
}

function splitIntoLines(outfield: LineupPlayer[], formation: string): LineupPlayer[][] {
  const sizes = formation.split('-').map(Number)
  const total = sizes.reduce((sum, size) => sum + size, 0)
  const byDepth = [...outfield].sort((first, second) => depthOf(first.position) - depthOf(second.position))
  // A formation that does not add up to the outfield players (unusual or malformed) falls back to the depth groups.
  if (total !== outfield.length || sizes.some((size) => !(size > 0))) return groupByDepth(byDepth)

  let start = 0
  return sizes.map((size) => byDepth.slice(start, (start += size)))
}

/**
 * Places the starters of a team on a horizontal pitch. The home team defends the left goal and the away team
 * the right one, so the away layout is the home one mirrored.
 */
export function layoutLineup(lineup: TeamLineup, side: PitchSide): PlacedPlayer[] {
  const goalkeeper = lineup.starters.find((player) => player.position === GOALKEEPER)
  const outfield = lineup.starters.filter((player) => player !== goalkeeper)
  const lines = splitIntoLines(outfield, lineup.formation)

  const mirror = (value: number) => (side === 'home' ? value : PITCH_SIZE - value)
  const placed: PlacedPlayer[] = goalkeeper ? [{ player: goalkeeper, x: mirror(GOALKEEPER_X), y: CENTER }] : []

  lines.forEach((line, lineIndex) => {
    const x = GOALKEEPER_X + ((lineIndex + 1) * FIELD_DEPTH) / lines.length
    const ordered = [...line].sort((first, second) => lateralOf(first.position) - lateralOf(second.position))
    ordered.forEach((player, index) => {
      placed.push({ player, x: mirror(x), y: mirror(((index + 1) / (ordered.length + 1)) * PITCH_SIZE) })
    })
  })
  return placed
}
