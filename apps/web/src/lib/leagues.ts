// ESPN identifies leagues by slug and its search results carry no display name.
const LEAGUE_NAMES: Record<string, string> = {
  'eng.1': 'Premier League',
  'eng.2': 'Championship',
  'esp.1': 'LaLiga',
  'ger.1': 'Bundesliga',
  'ita.1': 'Serie A',
  'fra.1': 'Ligue 1',
  'ned.1': 'Eredivisie',
  'por.1': 'Liga Portugal',
  'bra.1': 'Brasileirão',
  'arg.1': 'Liga Profesional',
  'mex.1': 'Liga MX',
  'usa.1': 'MLS',
  'per.1': 'Liga 1 (Perú)',
}

/** Friendly league name, falling back to ESPN's slug for leagues that are not listed. */
export function leagueLabel(slug: string): string {
  return LEAGUE_NAMES[slug] ?? slug
}
