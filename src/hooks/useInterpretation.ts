import { useState, useCallback } from 'react';
import { interpretationApi, ApiException } from '@/services/api';
import type { InterpretationResponse } from '@/types/api';

interface UseInterpretationReturn {
  interpretation: InterpretationResponse | null;
  loading: boolean;
  error: string | null;
  rateLimitExceeded: boolean;
  retryAfter: number | null;
  generate: (calculationId: string) => Promise<void>;
  reset: () => void;
}

export function useInterpretation(): UseInterpretationReturn {
  const [interpretation, setInterpretation] = useState<InterpretationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const generate = useCallback(async (calculationId: string) => {
    setLoading(true);
    setError(null);
    setRateLimitExceeded(false);
    setRetryAfter(null);

    try {
      const result = await interpretationApi.generate(calculationId);
      setInterpretation(result);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 429) {
          setRateLimitExceeded(true);
          setRetryAfter(err.retryAfter || 3600);
          setError('Límite de solicitudes alcanzado. Intente de nuevo más tarde.');
        } else if (err.status === 400) {
          setError('El cálculo aún no está completo.');
        } else if (err.status === 404) {
          setError('Cálculo no encontrado.');
        } else {
          setError(typeof err.detail === 'string' ? err.detail : 'Error al generar interpretación');
        }
      } else {
        setError('Error inesperado al contactar AWS Bedrock');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setInterpretation(null);
    setLoading(false);
    setError(null);
    setRateLimitExceeded(false);
    setRetryAfter(null);
  }, []);

  return {
    interpretation,
    loading,
    error,
    rateLimitExceeded,
    retryAfter,
    generate,
    reset,
  };
}
