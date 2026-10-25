import type { AnalysisResponse, Team, TeamAnalysis, TeamFixturesResponse } from '@futbol/core'

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export interface AnalysisParams {
  homeTeamId: number
  awayTeamId: number
  /** ISO date of the match; the analysis only looks at matches played before it. */
  kickoff: string
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? response.statusText
  } catch {
    // The error body is optional; a non-JSON failure (e.g. proxy error) falls back to the status text.
    return response.statusText
  }
}

async function getJson<Body>(path: string, signal: AbortSignal): Promise<Body> {
  const response = await fetch(path, { signal })
  if (!response.ok) {
    throw new ApiRequestError(response.status, await readErrorMessage(response))
  }
  return (await response.json()) as Body
}

export function fetchTeams(query: string, signal: AbortSignal): Promise<Team[]> {
  return getJson(`/api/teams/search?q=${encodeURIComponent(query)}`, signal)
}

export function fetchTeamFixtures(teamId: number, signal: AbortSignal): Promise<TeamFixturesResponse> {
  return getJson(`/api/teams/${teamId}/fixtures`, signal)
}

export function fetchTeamForm(teamId: number, signal: AbortSignal): Promise<TeamAnalysis> {
  return getJson(`/api/teams/${teamId}/form`, signal)
}

export function fetchAnalysis(params: AnalysisParams, signal: AbortSignal): Promise<AnalysisResponse> {
  const query = new URLSearchParams({
    home: String(params.homeTeamId),
    away: String(params.awayTeamId),
    kickoff: params.kickoff,
  })
  return getJson(`/api/analysis?${query}`, signal)
}
