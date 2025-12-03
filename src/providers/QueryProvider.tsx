import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create a client with optimized configuration for 10-minute backend updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Data remains fresh for 30 seconds
      gcTime: 600000, // Cache persists for 10 minutes (matches backend update frequency)
      refetchOnWindowFocus: true, // Enable refetch when user returns to tab
      refetchOnMount: false, // Disable refetch on component mount if data is cached
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
})

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export { queryClient }
