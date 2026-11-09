import type { TeamColors } from '@futbol/core'
import { describe, expect, it } from 'vitest'
import { FALLBACK_AWAY_COLOR, FALLBACK_HOME_COLOR, pickSideColors } from './team-colors'

const RED: TeamColors = { primary: '#990000', alternate: '#FCE38A' }
const GREEN: TeamColors = { primary: '#288A00', alternate: '#0A422D' }

describe('pickSideColors', () => {
  it('should_use_the_primary_color_of_each_team_when_they_are_distinguishable', () => {
    expect(pickSideColors(RED, GREEN)).toEqual({ home: '#990000', away: '#288A00' })
  })

  it('should_use_the_alternate_color_of_the_away_team_when_both_primaries_are_the_same', () => {
    const away: TeamColors = { primary: '#288A00', alternate: '#4B2B67' }

    expect(pickSideColors(GREEN, away)).toEqual({ home: '#288A00', away: '#4B2B67' })
  })

  it('should_use_a_neutral_color_for_the_away_team_when_none_of_its_colors_stands_out', () => {
    const away: TeamColors = { primary: '#2A8D05', alternate: '#2C8B02' }

    expect(pickSideColors(GREEN, away)).toEqual({ home: '#288A00', away: FALLBACK_AWAY_COLOR })
  })

  it('should_fall_back_to_neutral_colors_when_a_team_has_no_colors', () => {
    expect(pickSideColors(null, null)).toEqual({ home: FALLBACK_HOME_COLOR, away: FALLBACK_AWAY_COLOR })
    expect(pickSideColors(RED, null)).toEqual({ home: '#990000', away: FALLBACK_AWAY_COLOR })
    expect(pickSideColors(null, GREEN)).toEqual({ home: FALLBACK_HOME_COLOR, away: '#288A00' })
  })
})
