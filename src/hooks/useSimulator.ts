import { useState, useCallback } from 'react';
import { simulatorApi, ApiException } from '@/services/api';
import type { ScenarioRequest, ScenarioResponse } from '@/types/api';

interface ValidationWarning {
  field: 'price' | 'quantity' | 'general';
  message: string;
}

interface UseSimulatorReturn {
  result: ScenarioResponse | null;
  loading: boolean;
  error: {
    type: 'calculation_error' | 'network_error' | 'validation_error';
    message: string;
    recoverable: boolean;
  } | null;
  validationErrors: Record<string, string>;
  validationWarnings: ValidationWarning[];
  calculate: (request: ScenarioRequest) => Promise<void>;
  reset: () => void;
}

export function useSimulator(): UseSimulatorReturn {
  const [result, setResult] = useState<ScenarioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    type: 'calculation_error' | 'network_error' | 'validation_error';
    message: string;
    recoverable: boolean;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);

  const validate = (request: ScenarioRequest): { valid: boolean; warnings: ValidationWarning[] } => {
    const errors: Record<string, string> = {};
    const warnings: ValidationWarning[] = [];
    
    const priceInitial = parseFloat(request.price_initial);
    const priceFinal = parseFloat(request.price_final);
    const quantityInitial = parseFloat(request.quantity_initial);
    const quantityFinal = parseFloat(request.quantity_final);

    // Basic validation
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
    if (quantityInitial === quantityFinal) {
      errors.quantity_final = 'Las cantidades deben ser diferentes para calcular la elasticidad';
    }

    // Validate minimum variation requirements (backend requires 0.01% minimum)
    // Reject variations below 0.01%, warn for micro-variations (0.01% - 0.5%)
    if (priceInitial > 0 && priceFinal > 0 && !errors.price_final) {
      const priceChange = Math.abs(priceFinal - priceInitial);
      const priceVariationPercent = (priceChange / priceInitial) * 100;
      
      if (priceVariationPercent < 0.01) {
        errors.price_final = 
          `Variación de precio demasiado pequeña (${priceVariationPercent.toFixed(4)}%). ` +
          `Mínimo requerido: 0.01%`;
      } else if (priceVariationPercent < 0.5) {
        warnings.push({
          field: 'price',
          message: `Micro-variación de precio detectada (${priceVariationPercent.toFixed(2)}%). El resultado será sensible a redondeos.`
        });
      }
    }

    if (quantityInitial > 0 && quantityFinal > 0 && !errors.quantity_final) {
      const quantityChange = Math.abs(quantityFinal - quantityInitial);
      const quantityVariationPercent = (quantityChange / quantityInitial) * 100;
      
      if (quantityVariationPercent < 0.01) {
        errors.quantity_final = 
          `Variación de volumen demasiado pequeña (${quantityVariationPercent.toFixed(4)}%). ` +
          `Mínimo requerido: 0.01%`;
      } else if (quantityVariationPercent < 0.5) {
        warnings.push({
          field: 'quantity',
          message: `Micro-variación de volumen detectada (${quantityVariationPercent.toFixed(2)}%). El resultado será sensible a redondeos.`
        });
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
    return { valid: Object.keys(errors).length === 0, warnings };
  };

  const calculate = useCallback(async (request: ScenarioRequest) => {
    // Prevent race conditions - if already loading, ignore new requests
    if (loading) {
      return;
    }

    setError(null);
    setResult(null);

    const validation = validate(request);
    if (!validation.valid) {
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
          setError({
            type: 'network_error',
            message: 'Límite de solicitudes alcanzado. Intente de nuevo más tarde.',
            recoverable: true,
          });
        } else {
          // Determine error type based on status and message
          const errorMessage = typeof err.detail === 'string' ? err.detail : 'Error al calcular';
          const isCalculationError = err.status === 200 || 
            errorMessage.includes('Price variation too small') ||
            errorMessage.includes('Volume variation too small') ||
            errorMessage.includes('unrealistically high') ||
            errorMessage.includes('variación de precio') ||
            errorMessage.includes('variación de volumen');
          
          setError({
            type: isCalculationError ? 'calculation_error' : 'network_error',
            message: errorMessage,
            recoverable: true,
          });
        }
      } else {
        setError({
          type: 'network_error',
          message: 'Error inesperado al calcular',
          recoverable: false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setValidationErrors({});
    setValidationWarnings([]);
    setLoading(false);
  }, []);

  return {
    result,
    loading,
    error,
    validationErrors,
    validationWarnings,
    calculate,
    reset,
  };
}
