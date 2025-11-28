import { useState, useCallback, useRef, useEffect } from 'react';
import { elasticityApi, pollCalculationStatus, ApiException } from '@/services/api';
import type {
  CalculationRequest,
  CalculationStatusResponse,
  ParsedElasticityCalculation,
  CalculationSummary,
} from '@/types/api';

// ============================================
// Calculation Hook
// ============================================

interface UseElasticityCalculationReturn {
  calculation: ParsedElasticityCalculation | null;
  status: CalculationStatusResponse | null;
  loading: boolean;
  polling: boolean;
  error: string | null;
  elapsedTime: number;
  startCalculation: (request: CalculationRequest) => Promise<void>;
  cancelPolling: () => void;
  reset: () => void;
}

export function useElasticityCalculation(): UseElasticityCalculationReturn {
  const [calculation, setCalculation] = useState<ParsedElasticityCalculation | null>(null);
  const [status, setStatus] = useState<CalculationStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const pollingCancelledRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Elapsed time counter
  useEffect(() => {
    if (polling) {
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [polling]);

  const startCalculation = useCallback(async (request: CalculationRequest) => {
    setLoading(true);
    setPolling(false);
    setError(null);
    setCalculation(null);
    setStatus(null);
    setElapsedTime(0);
    pollingCancelledRef.current = false;

    try {
      // Step 1: Create calculation
      const initialResult = await elasticityApi.create(request);
      setStatus({
        id: initialResult.id,
        status: initialResult.status,
        is_complete: false,
        has_error: false,
        created_at: initialResult.created_at,
        completed_at: null,
      });

      // Step 2: Start polling
      setLoading(false);
      setPolling(true);

      const result = await pollCalculationStatus(initialResult.id, {
        intervalMs: 2000,
        maxAttempts: 30,
        onStatusChange: (statusUpdate) => {
          if (pollingCancelledRef.current) return;
          setStatus(statusUpdate);
        },
      });

      if (!pollingCancelledRef.current) {
        setCalculation(result);
        setPolling(false);
      }
    } catch (err) {
      if (!pollingCancelledRef.current) {
        if (err instanceof ApiException) {
          setError(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
        } else {
          setError('An unexpected error occurred');
        }
        setPolling(false);
        setLoading(false);
      }
    }
  }, []);

  const cancelPolling = useCallback(() => {
    pollingCancelledRef.current = true;
    setPolling(false);
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    pollingCancelledRef.current = true;
    setCalculation(null);
    setStatus(null);
    setLoading(false);
    setPolling(false);
    setError(null);
    setElapsedTime(0);
  }, []);

  return {
    calculation,
    status,
    loading,
    polling,
    error,
    elapsedTime,
    startCalculation,
    cancelPolling,
    reset,
  };
}

// ============================================
// Calculation History Hook
// ============================================

interface UseCalculationHistoryReturn {
  history: CalculationSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCalculation: (id: string) => Promise<ParsedElasticityCalculation | null>;
}

export function useCalculationHistory(): UseCalculationHistoryReturn {
  const [history, setHistory] = useState<CalculationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await elasticityApi.getRecent();
      setHistory(response.results);
      setError(null);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(typeof err.detail === 'string' ? err.detail : 'Failed to fetch history');
      } else {
        setError('Failed to fetch calculation history');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getCalculation = useCallback(async (id: string): Promise<ParsedElasticityCalculation | null> => {
    try {
      return await elasticityApi.getResults(id);
    } catch (err) {
      return null;
    }
  }, []);

  return { history, loading, error, refresh: fetchHistory, getCalculation };
}

// ============================================
// Load Single Calculation Hook
// ============================================

interface UseCalculationResultReturn {
  calculation: ParsedElasticityCalculation | null;
  loading: boolean;
  error: string | null;
  load: (id: string) => Promise<void>;
}

export function useCalculationResult(): UseCalculationResultReturn {
  const [calculation, setCalculation] = useState<ParsedElasticityCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await elasticityApi.getResults(id);
      setCalculation(result);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(typeof err.detail === 'string' ? err.detail : 'Failed to load calculation');
      } else {
        setError('Failed to load calculation');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculation, loading, error, load };
}
