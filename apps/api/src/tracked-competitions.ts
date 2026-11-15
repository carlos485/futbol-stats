import type { CompetitionRegion } from '@futbol/core'

const FLAG_BASE_URL = 'https://a.espncdn.com/i/teamlogos/countries/500'

export interface TrackedCompetition {
  /** ESPN slug of the competition. */
  id: string
  name: string
  /** ESPN's numeric id of the competition logo; some competitions (club friendlies) have none. */
  logoId?: number
  region: CompetitionRegion
}

/** `flagCode` is the three-letter code ESPN uses for the country's flag image. */
function country(name: string, flagCode: string): CompetitionRegion {
  return { kind: 'country', name, flagUrl: `${FLAG_BASE_URL}/${flagCode}.png` }
}

const SOUTH_AMERICA: CompetitionRegion = { kind: 'continent', name: 'Sudamérica', continent: 'south-america' }
const EUROPE: CompetitionRegion = { kind: 'continent', name: 'Europa', continent: 'europe' }
const WORLD: CompetitionRegion = { kind: 'world', name: 'Mundo' }

/** The competitions listed in the matches of the day, in display order. */
export const TRACKED_COMPETITIONS: readonly TrackedCompetition[] = [
  { id: 'per.1', name: 'Liga 1', logoId: 1813, region: country('Perú', 'per') },
  { id: 'esp.1', name: 'LaLiga', logoId: 15, region: country('España', 'esp') },
  { id: 'fra.1', name: 'Ligue 1', logoId: 9, region: country('Francia', 'fra') },
  { id: 'ger.1', name: 'Bundesliga', logoId: 10, region: country('Alemania', 'ger') },
  { id: 'eng.1', name: 'Premier League', logoId: 23, region: country('Inglaterra', 'eng') },
  { id: 'ita.1', name: 'Serie A', logoId: 12, region: country('Italia', 'ita') },
  { id: 'conmebol.libertadores', name: 'Copa Libertadores', logoId: 58, region: SOUTH_AMERICA },
  { id: 'conmebol.sudamericana', name: 'Copa Sudamericana', logoId: 1208, region: SOUTH_AMERICA },
  { id: 'uefa.champions', name: 'Champions League', logoId: 2, region: EUROPE },
  { id: 'uefa.nations', name: 'UEFA Nations League', logoId: 2395, region: EUROPE },
  { id: 'fifa.friendly', name: 'Amistosos de selecciones', logoId: 53, region: WORLD },
  { id: 'club.friendly', name: 'Amistosos de clubes', region: WORLD },
]
