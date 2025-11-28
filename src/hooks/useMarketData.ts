import { useState, useEffect, useCallback, useRef } from 'react';
import { marketDataApi, ApiException } from '@/services/api';
import type { ParsedMarketSnapshot, MacroeconomicIndicator } from '@/types/api';

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
