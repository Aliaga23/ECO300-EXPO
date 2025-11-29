import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { marketDataApi, ApiException } from '@/services/api';
import type { 
  ParsedMarketSnapshot, 
  MacroeconomicIndicator,
  AggregatedMarketDataResponse,
  TimeRange,
  Granularity,
  DataSource,
} from '@/types/api';

interface UseMarketDataReturn {
  snapshot: ParsedMarketSnapshot | null;
  previousSnapshot: ParsedMarketSnapshot | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useMarketData(autoRefreshMs = 30000): UseMarketDataReturn {
  const [snapshot, setSnapshot] = useState<ParsedMarketSnapshot | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<ParsedMarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await marketDataApi.getLatest();
      setPreviousSnapshot(snapshot);
      setSnapshot(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.detail as string);
      } else {
        setError('Failed to fetch market data');
      }
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  useEffect(() => {
    fetchData();

    if (autoRefreshMs > 0) {
      intervalRef.current = window.setInterval(fetchData, autoRefreshMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshMs]); // intentionally excluding fetchData to avoid infinite loop

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  return { snapshot, previousSnapshot, loading, error, lastUpdated, refresh };
}

interface UseBCBRateReturn {
  indicator: MacroeconomicIndicator | null;
  officialRate: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBCBRate(): UseBCBRateReturn {
  const [indicator, setIndicator] = useState<MacroeconomicIndicator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await marketDataApi.getIndicators();
      setIndicator(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.detail as string);
      } else {
        setError('Failed to fetch BCB rate');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // BCB rate updates daily, cache for 1 hour
    const interval = setInterval(fetchData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const officialRate = indicator ? parseFloat(indicator.official_exchange_rate) : 6.96;

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  return { indicator, officialRate, loading, error, refresh };
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

// Simple in-memory cache for session
const aggregatedCache = new Map<string, { data: AggregatedMarketDataResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function getCacheKey(params: UseAggregatedDataParams): string {
  return `${params.timeRange}:${params.granularity}:${params.source || 'p2p'}`;
}

export function useAggregatedData(params: UseAggregatedDataParams): UseAggregatedDataReturn {
  const { timeRange, granularity, source = 'p2p' } = params;
  
  const [data, setData] = useState<AggregatedMarketDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize cache key to prevent unnecessary fetches
  const cacheKey = useMemo(() => getCacheKey(params), [timeRange, granularity, source]);

  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache first
    if (!skipCache) {
      const cached = aggregatedCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Cancel previous request if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      const response = await marketDataApi.getAggregated({
        time_range: timeRange,
        granularity,
        source,
      });
      
      // Cache the result
      aggregatedCache.set(cacheKey, { data: response, timestamp: Date.now() });
      
      setData(response);
      setError(null);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (err instanceof ApiException) {
        setError(err.detail as string);
      } else {
        setError('Error al obtener datos agregados');
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, timeRange, granularity, source]);

  // Fetch when params change
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData(true); // Skip cache on manual refresh
  }, [fetchData]);

  return { data, loading, error, refresh };
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
