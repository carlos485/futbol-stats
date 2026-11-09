import { StatisticType, type Fixture, type Team, type TeamColors, type TeamStatistics } from '@futbol/core'
import type { ScheduleEvent, Scoreboard, SearchItem, Summary, TeamDetail } from './espn-schemas.ts'

// Pre-season and exhibition games: noisy form data that rarely has box score statistics.
const FRIENDLY_LEAGUE_PREFIXES = ['club.friendly', 'friendly.']
const SOCCER_SPORT = 'soccer'
const DEFAULT_LOGO_BASE_URL = 'https://a.espncdn.com/i/teamlogos/soccer/500'

const ESPN_STATUS_TO_SHORT: Record<string, string> = {
  STATUS_FULL_TIME: 'FT',
  STATUS_FINAL_AET: 'AET',
  STATUS_FINAL_PEN: 'PEN',
  STATUS_SCHEDULED: 'NS',
  STATUS_POSTPONED: 'PST',
}

const ESPN_STATISTIC_TO_TYPE: Record<string, StatisticType> = {
  wonCorners: StatisticType.CornerKicks,
  totalShots: StatisticType.TotalShots,
  shotsOnTarget: StatisticType.ShotsOnGoal,
  saves: StatisticType.GoalkeeperSaves,
  yellowCards: StatisticType.YellowCards,
  redCards: StatisticType.RedCards,
}

interface EspnTeam {
  id: string
  displayName: string
  logo?: string | undefined
  logos?: { href: string }[] | undefined
}

interface EspnStatus {
  type: { name: string; state: string }
}

function toLogo(team: { id: string; logo?: string | undefined; logos?: { href: string }[] | undefined }): string {
  return team.logo ?? team.logos?.[0]?.href ?? `${DEFAULT_LOGO_BASE_URL}/${team.id}.png`
}

function toFixtureTeam(team: EspnTeam) {
  return { id: Number(team.id), name: team.displayName, logo: toLogo(team) }
}

/** Translates ESPN's status names into the short codes the analysis understands (`FT`, `NS`, ...). */
export function toStatusCode(status: EspnStatus): string {
  const known = ESPN_STATUS_TO_SHORT[status.type.name]
  if (known) return known
  if (status.type.state === 'pre') return 'NS'
  if (status.type.state === 'in') return 'LIVE'
  return status.type.name
}

function parseScore(score: string | undefined): number | null {
  if (score === undefined || score.trim() === '') return null
  const value = Number(score)
  return Number.isFinite(value) ? value : null
}

export function isFriendlyLeague(slug: string): boolean {
  return FRIENDLY_LEAGUE_PREFIXES.some((prefix) => slug.startsWith(prefix))
}

/** Calendar entry of a team. Returns `undefined` for friendlies and for events without a home and an away side. */
export function scheduleEventToFixture(event: ScheduleEvent): Fixture | undefined {
  if (isFriendlyLeague(event.league.slug)) return undefined
  const competition = event.competitions[0]
  const home = competition.competitors.find((competitor) => competitor.homeAway === 'home')
  const away = competition.competitors.find((competitor) => competitor.homeAway === 'away')
  if (!home || !away) return undefined

  return {
    fixture: { id: Number(event.id), date: event.date, status: { short: toStatusCode(competition.status) } },
    league: { id: event.league.slug, name: event.league.name, season: event.season.year },
    teams: { home: toFixtureTeam(home.team), away: toFixtureTeam(away.team) },
    goals: { home: home.score?.value ?? null, away: away.score?.value ?? null },
  }
}

function toTeamStatistics(summary: Summary): TeamStatistics[] {
  const competitors = summary.header.competitions[0].competitors
  const entries: TeamStatistics[] = []
  for (const boxscoreTeam of summary.boxscore?.teams ?? []) {
    const statistics = (boxscoreTeam.statistics ?? []).flatMap((statistic) => {
      const type = ESPN_STATISTIC_TO_TYPE[statistic.name]
      const value = Number(statistic.displayValue)
      return type && Number.isFinite(value) ? [{ type, value }] : []
    })
    // A team without any known statistic means ESPN has no data for the match, not "zero of everything".
    const competitor = competitors.find((item) => item.team.id === boxscoreTeam.team.id)
    if (statistics.length > 0 && competitor) {
      entries.push({ team: { id: Number(competitor.team.id), name: competitor.team.displayName }, statistics })
    }
  }
  return entries
}

/** Full match summary with the box score statistics, in the same shape as a calendar fixture. */
export function summaryToFixture(summary: Summary, fixtureId: number): Fixture | undefined {
  const competition = summary.header.competitions[0]
  const home = competition.competitors.find((competitor) => competitor.homeAway === 'home')
  const away = competition.competitors.find((competitor) => competitor.homeAway === 'away')
  if (!home || !away) return undefined

  const statistics = toTeamStatistics(summary)
  return {
    fixture: { id: fixtureId, date: competition.date, status: { short: toStatusCode(competition.status) } },
    league: { id: summary.header.league.slug, name: summary.header.league.name, season: summary.header.season.year },
    teams: { home: toFixtureTeam(home.team), away: toFixtureTeam(away.team) },
    goals: { home: parseScore(home.score), away: parseScore(away.score) },
    statistics: statistics.length > 0 ? statistics : undefined,
  }
}

/** Keeps real soccer teams with a known league; the friendlies pseudo-leagues are noise. */
export function searchItemToTeam(item: SearchItem): Team | undefined {
  const isSoccerTeam = item.type === 'team' && item.sport === SOCCER_SPORT
  if (!isSoccerTeam || !item.league || isFriendlyLeague(item.league)) return undefined
  return {
    team: { id: Number(item.id), name: item.displayName, logo: toLogo(item) },
    league: { id: item.league },
  }
}

/** ESPN sends hex colors without the leading `#`. Without a primary color there is nothing to paint with. */
export function teamDetailToColors(detail: TeamDetail): TeamColors | null {
  const { color, alternateColor } = detail.team
  if (!color) return null
  return { primary: `#${color}`, alternate: `#${alternateColor ?? color}` }
}

/** The matches of one competition on a scoreboard. Matches not started yet carry a placeholder score, so it is ignored. */
export function scoreboardToFixtures(scoreboard: Scoreboard): Fixture[] {
  const league = scoreboard.leagues[0]
  return scoreboard.events.flatMap((event) => {
    const competition = event.competitions[0]
    const home = competition.competitors.find((competitor) => competitor.homeAway === 'home')
    const away = competition.competitors.find((competitor) => competitor.homeAway === 'away')
    if (!home || !away) return []
    const notStarted = competition.status.type.state === 'pre'
    return [
      {
        fixture: { id: Number(event.id), date: event.date, status: { short: toStatusCode(competition.status) } },
        league: { id: league.slug, name: league.name, season: event.season.year },
        teams: { home: toFixtureTeam(home.team), away: toFixtureTeam(away.team) },
        goals: notStarted ? { home: null, away: null } : { home: parseScore(home.score), away: parseScore(away.score) },
      },
    ]
  })
}
