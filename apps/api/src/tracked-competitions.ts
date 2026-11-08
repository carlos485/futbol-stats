export interface TrackedCompetition {
  /** ESPN slug of the competition. */
  id: string
  name: string
}

/** The competitions listed in the matches of the day, in display order. */
export const TRACKED_COMPETITIONS: readonly TrackedCompetition[] = [
  { id: 'per.1', name: 'Liga 1 (Perú)' },
  { id: 'esp.1', name: 'LaLiga (España)' },
  { id: 'fra.1', name: 'Ligue 1 (Francia)' },
  { id: 'ger.1', name: 'Bundesliga (Alemania)' },
  { id: 'eng.1', name: 'Premier League (Inglaterra)' },
  { id: 'ita.1', name: 'Serie A (Italia)' },
  { id: 'conmebol.libertadores', name: 'Copa Libertadores' },
  { id: 'conmebol.sudamericana', name: 'Copa Sudamericana' },
  { id: 'uefa.champions', name: 'Champions League' },
]
