import { useQuery } from '@tanstack/react-query'
import { fetchAnalysis, fetchMatchday, fetchTeamFixtures, fetchTeamForm, fetchTeams, type AnalysisParams } from '@/lib/api'

export const MIN_SEARCH_LENGTH = 3

// Scores change while matches are being played, so the list is refreshed every minute (the API caches that long).
const MATCHDAY_REFRESH_MS = 60 * 1000

export function useMatchday() {
  return useQuery({
    queryKey: ['matchday'],
    queryFn: ({ signal }) => fetchMatchday(signal),
    staleTime: MATCHDAY_REFRESH_MS,
    refetchInterval: MATCHDAY_REFRESH_MS,
  })
}

export function useTeamSearch(query: string) {
  const search = query.trim().toLowerCase()
  return useQuery({
    queryKey: ['teams', search],
    queryFn: ({ signal }) => fetchTeams(search, signal),
    enabled: search.length >= MIN_SEARCH_LENGTH,
  })
}

export function useTeamFixtures(teamId: number) {
  return useQuery({
    queryKey: ['team-fixtures', teamId],
    queryFn: ({ signal }) => fetchTeamFixtures(teamId, signal),
  })
}

export function useTeamForm(teamId: number) {
  return useQuery({
    queryKey: ['team-form', teamId],
    queryFn: ({ signal }) => fetchTeamForm(teamId, signal),
  })
}

export function useAnalysis(params: AnalysisParams) {
  return useQuery({
    queryKey: ['analysis', params],
    queryFn: ({ signal }) => fetchAnalysis(params, signal),
  })
}
