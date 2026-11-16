import type { CompetitionRegion } from '@futbol/core'

// Images live in apps/web/public/logos and are served by the web app.
const IMAGES_PATH = '/logos'

export interface TrackedCompetition {
  /** ESPN slug of the competition. */
  id: string
  name: string
  /** File name of the logo inside the images folder. */
  logoFile: string
  region: CompetitionRegion
}

/** `imageFile` is the file name of the flag or map inside the images folder. */
function region(name: string, imageFile: string): CompetitionRegion {
  return { name, image: `${IMAGES_PATH}/${imageFile}` }
}

export function logoUrl(competition: Pick<TrackedCompetition, 'logoFile'>): string {
  return `${IMAGES_PATH}/${competition.logoFile}`
}

const SOUTH_AMERICA = region('Sudamérica', 'south-america.webp')
const EUROPE = region('Europa', 'europe.webp')
const WORLD = region('Mundo', 'world.png')

/** The competitions listed in the matches of the day, in display order. */
export const TRACKED_COMPETITIONS: readonly TrackedCompetition[] = [
  { id: 'per.1', name: 'Liga 1', logoFile: 'per.1.png', region: region('Perú', 'per.svg') },
  { id: 'esp.1', name: 'LaLiga', logoFile: 'esp.1.png', region: region('España', 'esp.webp') },
  { id: 'fra.1', name: 'Ligue 1', logoFile: 'fra.1.png', region: region('Francia', 'fra.webp') },
  { id: 'ger.1', name: 'Bundesliga', logoFile: 'ger.1.png', region: region('Alemania', 'ger.webp') },
  { id: 'eng.1', name: 'Premier League', logoFile: 'eng.1.png', region: region('Inglaterra', 'eng.svg') },
  { id: 'ita.1', name: 'Serie A', logoFile: 'ita.1.png', region: region('Italia', 'ita.webp') },
  { id: 'conmebol.libertadores', name: 'Copa Libertadores', logoFile: 'conmebol.libertadores.webp', region: SOUTH_AMERICA },
  { id: 'conmebol.sudamericana', name: 'Copa Sudamericana', logoFile: 'conmebol.sudamericana.png', region: SOUTH_AMERICA },
  { id: 'uefa.champions', name: 'Champions League', logoFile: 'uefa.champions.webp', region: EUROPE },
  { id: 'uefa.nations', name: 'UEFA Nations League', logoFile: 'uefa.nations.png', region: EUROPE },
  { id: 'fifa.friendly', name: 'Amistosos de selecciones', logoFile: 'fifa.friendly.svg', region: WORLD },
  { id: 'club.friendly', name: 'Amistosos de clubes', logoFile: 'club.friendly.png', region: WORLD },
]
