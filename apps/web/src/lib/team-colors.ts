import type { TeamColors } from '@futbol/core'

/** Neutral theme colors used when a team has no usable color. */
export const FALLBACK_HOME_COLOR = 'var(--chart-1)'
export const FALLBACK_AWAY_COLOR = 'var(--chart-2)'

// Euclidean distance in RGB space (0 to ~441); below this two bars are hard to tell apart.
const MIN_COLOR_DISTANCE = 80
const HEX_RADIX = 16
const CHANNEL_HEX_LENGTH = 2
const RGB_CHANNELS = 3

const LIGHT_BACKGROUND_LUMINANCE = 0.6
const MAX_CHANNEL = 255
const RED_WEIGHT = 0.299
const GREEN_WEIGHT = 0.587
const BLUE_WEIGHT = 0.114

/** Black or white, whichever reads better on top of the given hex color (white for theme variables). */
export function readableTextColor(background: string): string {
  if (!background.startsWith('#')) return '#fff'
  const [red, green, blue] = toRgb(background)
  const luminance = (RED_WEIGHT * red + GREEN_WEIGHT * green + BLUE_WEIGHT * blue) / MAX_CHANNEL
  return luminance > LIGHT_BACKGROUND_LUMINANCE ? '#000' : '#fff'
}

export interface SideColors {
  home: string
  away: string
}

function toRgb(hex: string): number[] {
  const digits = hex.replace('#', '')
  return Array.from({ length: RGB_CHANNELS }, (_, channel) =>
    Number.parseInt(digits.slice(channel * CHANNEL_HEX_LENGTH, (channel + 1) * CHANNEL_HEX_LENGTH), HEX_RADIX),
  )
}

function distance(first: string, second: string): number {
  const [firstRgb, secondRgb] = [toRgb(first), toRgb(second)]
  return Math.hypot(...firstRgb.map((value, channel) => value - secondRgb[channel]))
}

/**
 * Colors to paint each side of a match. The home team keeps its primary color; the away team uses its primary one
 * unless it looks like the home team's, then its alternate one, and finally a neutral color if both clash.
 */
export function pickSideColors(home: TeamColors | null, away: TeamColors | null): SideColors {
  const homeColor = home?.primary ?? FALLBACK_HOME_COLOR
  if (!away) return { home: homeColor, away: FALLBACK_AWAY_COLOR }
  if (!home) return { home: homeColor, away: away.primary }

  const awayColor = [away.primary, away.alternate].find((candidate) => distance(candidate, home.primary) >= MIN_COLOR_DISTANCE)
  return { home: homeColor, away: awayColor ?? FALLBACK_AWAY_COLOR }
}
