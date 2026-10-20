import { useQuery } from '@tanstack/react-query'
import { fetchAnalysis, fetchTeamFixtures, fetchTeams, type AnalysisParams } from '@/lib/api'

export const MIN_SEARCH_LENGTH = 3

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

export function useAnalysis(params: AnalysisParams) {
  return useQuery({
    queryKey: ['analysis', params],
    queryFn: ({ signal }) => fetchAnalysis(params, signal),
  })
}
