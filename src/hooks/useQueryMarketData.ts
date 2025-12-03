import { useQuery } from '@tanstack/react-query'
import { marketDataApi } from '@/services/api'
import type { AggregatedMarketDataRequest } from '@/types/api'

// Centralized hook for latest market data - replaces all independent polling
export function useLatestMarketData() {
  return useQuery({
    queryKey: ['marketData', 'latest'],
    queryFn: async () => {
      const response = await marketDataApi.getLatest()
      return response
    },
    staleTime: 30000, // 30 seconds - matches current polling frequency
    gcTime: 300000, // 5 minutes ( React Query v5 uses gcTime instead of cacheTime
    refetchInterval: 30000, // Automatic background refetch every 30 seconds
    refetchIntervalInBackground: false, // Only refetch when tab is active
  })
}

// Centralized hook for BCB indicators - replaces useBCBRate polling
export function useBCBIndicators() {
  return useQuery({
    queryKey: ['bcb', 'indicators', 'latest'],
    queryFn: async () => {
      const response = await marketDataApi.getIndicators()
      return response
    },
    staleTime: 60000, // BCB rates change infrequently, cache for 1 minute
    gcTime: 600000, // 10 minutes ( React Query v5 uses gcTime instead of cacheTime
    refetchInterval: 60000, // Refetch every minute instead of hourly
    refetchIntervalInBackground: false,
  })
}

// Centralized hook for aggregated market data - replaces scattered fetch calls
export function useAggregatedMarketData(params: AggregatedMarketDataRequest = {}) {
  return useQuery({
    queryKey: ['marketData', 'aggregated', params.time_range, params.granularity, params.source],
    queryFn: async () => {
      const response = await marketDataApi.getAggregated(params)
      return response
    },
    staleTime: 60000, // 1 minute for aggregated data
    gcTime: 300000, // 5 minutes ( React Query v5 uses gcTime instead of cacheTime
    enabled: true, // Always enabled
  })
}

// Hook for historical data with time range and granularity
export function useHistoricalMarketData(timeRange: string, granularity: string) {
  return useQuery({
    queryKey: ['marketData', 'historical', timeRange, granularity],
    queryFn: async () => {
      const response = await marketDataApi.getAggregated({
        time_range: timeRange as any,
        granularity: granularity as any,
        source: 'all',
      })
      return response
    },
    staleTime: 60000,
    gcTime: 300000, // React Query v5 uses gcTime instead of cacheTime
  })
}

// Utility hook for manual refresh - replaces scattered refresh functions
export function useRefreshMarketData() {
  const queryClient = useQueryClient()
  
  const refreshLatest = () => {
    return queryClient.invalidateQueries({ queryKey: ['marketData', 'latest'] })
  }
  
  const refreshBCB = () => {
    return queryClient.invalidateQueries({ queryKey: ['bcb', 'indicators', 'latest'] })
  }
  
  const refreshAggregated = () => {
    return queryClient.invalidateQueries({ queryKey: ['marketData', 'aggregated'] })
  }
  
  const refreshAll = () => {
    return Promise.all([
      refreshLatest(),
      refreshBCB(),
      refreshAggregated(),
    ])
  }
  
  return {
    refreshLatest,
    refreshBCB,
    refreshAggregated,
    refreshAll,
  }
}

// Import QueryClient for the refresh hook
import { useQueryClient } from '@tanstack/react-query'
