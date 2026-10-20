import { QueryClient } from '@tanstack/react-query'

const STALE_TIME_MS = 30 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      // A retry would only repeat a failing call against an API we do not control.
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})
