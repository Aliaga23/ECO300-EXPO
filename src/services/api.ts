import axios, { type AxiosError } from 'axios';
import type {
  MarketSnapshot,
  MacroeconomicIndicator,
  CalculationRequest,
  CalculationStatusResponse,
  ElasticityCalculation,
  CalculationSummary,
  InterpretationRequest,
  InterpretationResponse,
  ScenarioRequest,
  ScenarioResponse,
  PaginatedResponse,
  APIError,
  ParsedMarketSnapshot,
  ParsedElasticityCalculation,
} from '@/types/api';

// ============================================
// API Configuration
// ============================================

// Use relative path for proxy in development, or full URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ============================================
// Error Handling
// ============================================

export class ApiException extends Error {
  public readonly status: number;
  public readonly detail: string | Record<string, string[]>;
  public readonly retryAfter?: number;

  constructor(status: number, error: string, detail: string | Record<string, string[]>, retryAfter?: number) {
    super(error);
    this.name = 'ApiException';
    this.status = status;
    this.detail = detail;
    this.retryAfter = retryAfter;
  }
}

function handleApiError(error: AxiosError<APIError>): never {
  if (error.response) {
    const { status, data } = error.response;
    throw new ApiException(
      status,
      data?.error || 'Unknown error',
      data?.detail || error.message,
      data?.retry_after
    );
  } else if (error.request) {
    throw new ApiException(0, 'Network Error', 'Unable to connect to server. Please check your connection.');
  } else {
    throw new ApiException(0, 'Request Error', error.message);
  }
}

// ============================================
// Data Parsing Utilities
// ============================================

export function parseMarketSnapshot(snapshot: MarketSnapshot): ParsedMarketSnapshot {
  return {
    id: snapshot.id,
    timestamp: new Date(snapshot.timestamp),
    averageSellPrice: parseFloat(snapshot.average_sell_price),
    averageBuyPrice: parseFloat(snapshot.average_buy_price),
    totalVolume: parseFloat(snapshot.total_volume),
    spreadPercentage: parseFloat(snapshot.spread_percentage),
    numActiveTraders: snapshot.num_active_traders,
    dataQualityScore: parseFloat(snapshot.data_quality_score),
  };
}

export function parseElasticityCalculation(calc: ElasticityCalculation): ParsedElasticityCalculation {
  return {
    id: calc.id,
    status: calc.status,
    method: calc.method,
    startDate: new Date(calc.start_date),
    endDate: new Date(calc.end_date),
    windowSize: calc.window_size,
    elasticityCoefficient: calc.elasticity_coefficient ? parseFloat(calc.elasticity_coefficient) : null,
    elasticityMagnitude: calc.elasticity_magnitude ?? null,
    classification: calc.classification,
    confidenceInterval: calc.confidence_interval_95,
    rSquared: calc.r_squared ? parseFloat(calc.r_squared) : null,
    standardError: calc.standard_error ? parseFloat(calc.standard_error) : null,
    dataPointsUsed: calc.data_points_used,
    averageDataQuality: calc.average_data_quality ? parseFloat(calc.average_data_quality) : null,
    isSignificant: calc.is_significant,
    errorMessage: calc.error_message,
    createdAt: new Date(calc.created_at),
    completedAt: calc.completed_at ? new Date(calc.completed_at) : null,
  };
}

// ============================================
// Market Data Endpoints
// ============================================

export const marketDataApi = {
  /**
   * Get latest market snapshot
   * Rate limit: 100 requests/hour
   */
  async getLatest(): Promise<ParsedMarketSnapshot> {
    try {
      const response = await apiClient.get<MarketSnapshot>('/market-data/latest/');
      return parseMarketSnapshot(response.data);
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },

  /**
   * Get historical market snapshots with pagination
   * Rate limit: 100 requests/hour
   */
  async getHistorical(page = 1, pageSize = 50): Promise<PaginatedResponse<ParsedMarketSnapshot>> {
    try {
      const response = await apiClient.get<PaginatedResponse<MarketSnapshot>>('/market-data/', {
        params: { page, page_size: pageSize },
      });
      return {
        ...response.data,
        results: response.data.results.map(parseMarketSnapshot),
      };
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },

  /**
   * Get BCB official exchange rate (latest)
   * Rate limit: 100 requests/hour
   */
  async getIndicators(): Promise<MacroeconomicIndicator> {
    try {
      const response = await apiClient.get<MacroeconomicIndicator>('/market-data/indicators/latest/');
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },
};

// ============================================
// Elasticity Calculation Endpoints
// ============================================

export const elasticityApi = {
  /**
   * Create a new elasticity calculation (async)
   * Rate limit: 10 requests/hour
   */
  async create(request: CalculationRequest): Promise<ElasticityCalculation> {
    try {
      const response = await apiClient.post<ElasticityCalculation>('/elasticity/calculate/', request);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },

  /**
   * Poll calculation status (lightweight endpoint)
   * Rate limit: Unlimited
   */
  async getStatus(id: string): Promise<CalculationStatusResponse> {
    try {
      const response = await apiClient.get<CalculationStatusResponse>(`/elasticity/${id}/status/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },

  /**
   * Get full calculation results
   * Rate limit: 100 requests/hour
   */
  async getResults(id: string): Promise<ParsedElasticityCalculation> {
    try {
      const response = await apiClient.get<ElasticityCalculation>(`/elasticity/${id}/`);
      return parseElasticityCalculation(response.data);
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },

  /**
   * Get recent calculations for current IP
   * Rate limit: 100 requests/hour
   */
  async getRecent(): Promise<{ count: number; results: CalculationSummary[] }> {
    try {
      const response = await apiClient.get<{ count: number; results: CalculationSummary[] }>('/elasticity/recent/');
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },
};

// ============================================
// AI Interpretation Endpoints
// ============================================

export const interpretationApi = {
  /**
   * Generate AI interpretation for a calculation
   * Rate limit: 5 requests/hour (strict - AWS costs)
   */
  async generate(calculationId: string): Promise<InterpretationResponse> {
    try {
      const request: InterpretationRequest = { calculation_id: calculationId };
      const response = await apiClient.post<InterpretationResponse>('/interpret/generate/', request);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },
};

// ============================================
// Scenario Simulator Endpoints
// ============================================

export const simulatorApi = {
  /**
   * Calculate hypothetical elasticity (synchronous)
   * Rate limit: 50 requests/hour
   */
  async calculate(request: ScenarioRequest): Promise<ScenarioResponse> {
    try {
      const response = await apiClient.post<ScenarioResponse>('/simulator/scenario/', request);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },
};

// ============================================
// Report Generation Endpoints
// ============================================

export const reportsApi = {
  /**
   * Download PDF report for a calculation
   * Rate limit: 10 requests/hour
   */
  async downloadPdf(calculationId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/reports/${calculationId}/pdf/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },

  /**
   * Trigger PDF download in browser
   */
  triggerDownload(blob: Blob, calculationId: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `elasticity-report-${calculationId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// ============================================
// Polling Utility
// ============================================

export interface PollOptions {
  intervalMs?: number;
  maxAttempts?: number;
  onStatusChange?: (status: CalculationStatusResponse) => void;
}

export async function pollCalculationStatus(
  calculationId: string,
  options: PollOptions = {}
): Promise<ParsedElasticityCalculation> {
  const { intervalMs = 2000, maxAttempts = 30, onStatusChange } = options;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await elasticityApi.getStatus(calculationId);
    onStatusChange?.(status);

    if (status.is_complete) {
      return elasticityApi.getResults(calculationId);
    }

    if (status.has_error) {
      const results = await elasticityApi.getResults(calculationId);
      throw new ApiException(400, 'Calculation Failed', results.errorMessage || 'Unknown error');
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new ApiException(408, 'Timeout', 'Calculation took too long. Please try again.');
}

// ============================================
// Export all APIs
// ============================================

export const api = {
  marketData: marketDataApi,
  elasticity: elasticityApi,
  interpretation: interpretationApi,
  simulator: simulatorApi,
  reports: reportsApi,
};

export default api;
