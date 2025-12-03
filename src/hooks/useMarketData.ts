import { useState, useEffect, useCallback, useMemo } from 'react';
import { marketDataApi, ApiException } from '@/services/api';
import type { 
  ParsedLatestMarketData, 
  ParsedMarketSnapshot, 
  MacroeconomicIndicator,
  AggregatedMarketDataResponse,
  TimeRange,
  Granularity,
  DataSource,
  ExchangeRateDetail,
} from '@/types/api';
import { useLatestMarketData, useAggregatedMarketData, useBCBIndicators } from './useQueryMarketData';

interface UseMarketDataReturn {
  /** Latest market snapshot with all computed fields from backend */
  snapshot: ParsedLatestMarketData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useMarketData(): UseMarketDataReturn {
  // Use React Query instead of manual polling - eliminates duplicate requests
  const { data: snapshot, isLoading, error, refetch } = useLatestMarketData();
  
  // Note: marketDataApi.getLatest() already calls parseLatestMarketData() internally
  // so snapshot is already the parsed ParsedLatestMarketData object

  // Use React Query's refetch instead of manual refresh
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { 
    snapshot: snapshot || null, // Convert undefined to null for compatibility
    loading: isLoading, 
    error: error?.message || null, 
    lastUpdated: snapshot?.timestamp ? new Date(snapshot.timestamp) : null,
    refresh 
  };
}

// Helper function to parse exchange rate with backward compatibility
function parseExchangeRate(rate: string | ExchangeRateDetail | undefined): ExchangeRateDetail | null {
  if (!rate) return null;
  
  // If it's already the new object structure, return as-is
  if (typeof rate === 'object' && 'buy' in rate && 'sell' in rate) {
    return rate as ExchangeRateDetail;
  }
  
  // Legacy string format - create ExchangeRateDetail from string
  const rateValue = typeof rate === 'string' ? parseFloat(rate) : 0;
  if (isNaN(rateValue)) return null;
  
  // For legacy format, we don't have buy/sell spread, so use same value for both
  return {
    buy: rateValue.toFixed(2),
    sell: rateValue.toFixed(2),
    spread: '0.00',
    spread_percentage: '0.00',
  };
}

interface UseBCBRateReturn {
  indicator: MacroeconomicIndicator | null;
  officialRate: ExchangeRateDetail | null;
  referentialRate: ExchangeRateDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBCBRate(): UseBCBRateReturn {
  // Use React Query instead of manual polling - eliminates duplicate requests
  const { data: indicator, isLoading, error, refetch } = useBCBIndicators();
  
  // Parse rates with backward compatibility
  const officialRate = useMemo(() => {
    if (!indicator) return null;
    
    // Try new structure first, then legacy
    if (indicator.official_exchange_rate && typeof indicator.official_exchange_rate === 'object') {
      return indicator.official_exchange_rate as ExchangeRateDetail;
    }
    
    // Fallback to legacy string format
    return parseExchangeRate(indicator.official_exchange_rate);
  }, [indicator]);

  const referentialRate = useMemo(() => {
    if (!indicator) return null;
    
    // New field - if available, parse it
    if (indicator.referential_exchange_rate) {
      return indicator.referential_exchange_rate;
    }
    
    return null; // Referential rate not available in legacy format
  }, [indicator]);

  // Use React Query's refetch instead of manual refresh
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { 
    indicator: indicator || null, // Convert undefined to null for compatibility
    officialRate, 
    referentialRate, 
    loading: isLoading, 
    error: error?.message || null, 
    refresh 
  };
}

interface UseHistoricalDataReturn {
  data: ParsedMarketSnapshot[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useHistoricalData(initialPageSize = 100): UseHistoricalDataReturn {
  const [data, setData] = useState<ParsedMarketSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (pageNum: number, append = false) => {
    try {
      setLoading(true);
      const response = await marketDataApi.getHistorical(pageNum, initialPageSize);
      
      if (append) {
        setData((prev) => [...prev, ...response.results]);
      } else {
        setData(response.results);
      }
      
      setHasMore(response.next !== null);
      setError(null);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.detail as string);
      } else {
        setError('Failed to fetch historical data');
      }
    } finally {
      setLoading(false);
    }
  }, [initialPageSize]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchData(nextPage, true);
  }, [hasMore, loading, page, fetchData]);

  const refresh = useCallback(async () => {
    setPage(1);
    await fetchData(1);
  }, [fetchData]);

  return { data, loading, error, hasMore, loadMore, refresh };
}

// ============================================
// Aggregated Market Data Hook (Backend-driven)
// ============================================

interface UseAggregatedDataParams {
  timeRange: TimeRange;
  granularity: Granularity;
  source?: DataSource;
}

interface UseAggregatedDataReturn {
  data: AggregatedMarketDataResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAggregatedData(params: UseAggregatedDataParams): UseAggregatedDataReturn {
  // Use React Query instead of manual caching and polling - eliminates duplicate requests
  const { data, isLoading, error, refetch } = useAggregatedMarketData({
    time_range: params.timeRange,
    granularity: params.granularity,
    source: params.source || 'p2p',
  });
  
  // Use React Query's refetch instead of manual refresh
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { 
    data: data || null, // Convert undefined to null for compatibility
    loading: isLoading, 
    error: error?.message || null, 
    refresh 
  };
}

// Helper to format data source for display
export function formatDataSource(source: string): string {
  const sourceLabels: Record<string, string> = {
    'p2p_scrape_json': 'P2P Scraper',
    'external_ohlc_api': 'OHLC API',
    'p2p': 'P2P',
    'ohlc': 'OHLC',
    'all': 'Todas las fuentes',
  };
  return sourceLabels[source] || source;
}
