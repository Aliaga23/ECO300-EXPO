import { useState, useCallback } from 'react';
import { simulatorApi, ApiException } from '@/services/api';
import type { ScenarioRequest, ScenarioResponse } from '@/types/api';

interface UseSimulatorReturn {
  result: ScenarioResponse | null;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  calculate: (request: ScenarioRequest) => Promise<void>;
  reset: () => void;
}

export function useSimulator(): UseSimulatorReturn {
  const [result, setResult] = useState<ScenarioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (request: ScenarioRequest): boolean => {
    const errors: Record<string, string> = {};
    
    const priceInitial = parseFloat(request.price_initial);
    const priceFinal = parseFloat(request.price_final);
    const quantityInitial = parseFloat(request.quantity_initial);
    const quantityFinal = parseFloat(request.quantity_final);

    if (isNaN(priceInitial) || priceInitial <= 0) {
      errors.price_initial = 'El precio inicial debe ser un número positivo';
    }
    if (isNaN(priceFinal) || priceFinal <= 0) {
      errors.price_final = 'El precio final debe ser un número positivo';
    }
    if (isNaN(quantityInitial) || quantityInitial <= 0) {
      errors.quantity_initial = 'La cantidad inicial debe ser un número positivo';
    }
    if (isNaN(quantityFinal) || quantityFinal <= 0) {
      errors.quantity_final = 'La cantidad final debe ser un número positivo';
    }
    if (priceInitial === priceFinal) {
      errors.price_final = 'Los precios deben ser diferentes para calcular la elasticidad';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculate = useCallback(async (request: ScenarioRequest) => {
    setError(null);
    setResult(null);

    if (!validate(request)) {
      return;
    }

    setLoading(true);
    try {
      const response = await simulatorApi.calculate(request);
      setResult(response);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 400 && typeof err.detail === 'object') {
          // Convert array of errors to single string per field
          const details = err.detail as Record<string, string[]>;
          const flatErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(details)) {
            flatErrors[key] = Array.isArray(value) ? value.join(', ') : String(value);
          }
          setValidationErrors(flatErrors);
        } else if (err.status === 429) {
          setError('Límite de solicitudes alcanzado. Intente de nuevo más tarde.');
        } else {
          setError(typeof err.detail === 'string' ? err.detail : 'Error al calcular');
        }
      } else {
        setError('Error inesperado al calcular');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setValidationErrors({});
    setLoading(false);
  }, []);

  return {
    result,
    loading,
    error,
    validationErrors,
    calculate,
    reset,
  };
}
