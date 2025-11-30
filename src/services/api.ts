import axios, { type AxiosError } from 'axios';
import type {
  MarketSnapshot,
  LatestMarketData,
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
  ParsedLatestMarketData,
  ParsedElasticityCalculation,
  DataCoverage,
  AggregatedMarketDataResponse,
  AggregatedMarketDataRequest,
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

export function parseLatestMarketData(data: LatestMarketData): ParsedLatestMarketData {
  return {
    // Core snapshot fields
    id: data.id,
    timestamp: new Date(data.timestamp),
    averageSellPrice: parseFloat(data.average_sell_price),
    averageBuyPrice: parseFloat(data.average_buy_price),
    totalVolume: parseFloat(data.total_volume),
    spreadPercentage: parseFloat(data.spread_percentage),
    numActiveTraders: data.num_active_traders,
    dataQualityScore: parseFloat(data.data_quality_score),
    
    // Price change fields (from backend)
    priceChangePercentage: data.price_change_percentage,
    priceChangeDirection: data.price_change_direction,
    previousPrice: data.previous_price,
    isFirstSnapshot: data.is_first_snapshot ?? false,
    
    // Time gap warning
    timeGapMinutes: data.time_gap_minutes,
    timeGapWarning: data.time_gap_warning ?? false,
    
    // BCB / Market premium fields
    marketPremiumPercentage: data.market_premium_percentage,
    bcbOfficialRate: data.bcb_official_rate,
    bcbRateDate: data.bcb_rate_date,
    bcbRateStale: data.bcb_rate_stale ?? false,
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
    classificationLabel: calc.classification_label ?? null,
    confidenceInterval: calc.confidence_interval_95,
    rSquared: calc.r_squared ? parseFloat(calc.r_squared) : null,
    standardError: calc.standard_error ? parseFloat(calc.standard_error) : null,
    dataPointsUsed: calc.data_points_used,
    averageDataQuality: calc.average_data_quality ? parseFloat(calc.average_data_quality) : null,
    isSignificant: calc.is_significant,
    isReliable: calc.is_reliable ?? true,
    reliabilityNote: calc.reliability_note ?? null,
    errorMessage: calc.error_message,
    createdAt: new Date(calc.created_at),
    completedAt: calc.completed_at ? new Date(calc.completed_at) : null,
    calculationMetadata: calc.calculation_metadata,
  };
}

// ============================================
// Market Data Endpoints
// ============================================

export const marketDataApi = {
  /**
   * Get latest market snapshot with computed fields from backend
   * Includes: price_change_percentage, price_change_direction, market_premium_percentage, etc.
   * Rate limit: 100 requests/hour
   */
  async getLatest(): Promise<ParsedLatestMarketData> {
    try {
      const response = await apiClient.get<LatestMarketData>('/market-data/latest/');
      return parseLatestMarketData(response.data);
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

  /**
   * Get aggregated market data from backend
   * This endpoint performs server-side aggregation for optimal performance
   * Rate limit: 100 requests/hour
   */
  async getAggregated(params: AggregatedMarketDataRequest = {}): Promise<AggregatedMarketDataResponse> {
    try {
      const response = await apiClient.get<AggregatedMarketDataResponse>('/market-data/aggregated/', {
        params: {
          time_range: params.time_range,
          granularity: params.granularity,
          source: params.source,
          start_date: params.start_date,
          end_date: params.end_date,
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError<APIError>);
    }
  },

  /**
   * Get data coverage information (min/max dates available)
   * This helps the form constrain date selection to valid ranges
   * Rate limit: 100 requests/hour
   */
  async getDataCoverage(): Promise<DataCoverage | null> {
    try {
      // Try to get coverage from a dedicated endpoint if available
      const response = await apiClient.get<DataCoverage>('/market-data/coverage/');
      return response.data;
    } catch {
      // If endpoint doesn't exist, try to infer from historical data
      try {
        const historical = await this.getHistorical(1, 1);
        if (historical.count > 0 && historical.results.length > 0) {
          // Get first page to find latest, and last page to find earliest
          const lastPage = Math.ceil(historical.count / 50);
          const [firstPageData, lastPageData] = await Promise.all([
            this.getHistorical(1, 50),
            this.getHistorical(lastPage, 50),
          ]);
          const allSnapshots = [...firstPageData.results, ...lastPageData.results];
          const dates = allSnapshots.map(s => s.timestamp);
          return {
            min_date: new Date(Math.min(...dates.map(d => d.getTime()))).toISOString(),
            max_date: new Date(Math.max(...dates.map(d => d.getTime()))).toISOString(),
            total_snapshots: historical.count,
            source: 'external_ohlc_api',
          };
        }
        return null;
      } catch {
        return null;
      }
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
      console.log('API Client - Sending request to /elasticity/calculate/:', request);
      const response = await apiClient.post<ElasticityCalculation>('/elasticity/calculate/', request);
      console.log('API Client - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Client - Error:', error);
      if (error instanceof Error && 'response' in error) {
        console.error('API Client - Error response:', (error as any).response?.data);
      }
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

export interface PollResult {
  calculation: ParsedElasticityCalculation;
  failed: boolean;
}

export async function pollCalculationStatus(
  calculationId: string,
  options: PollOptions = {}
): Promise<PollResult> {
  const { intervalMs = 2000, maxAttempts = 30, onStatusChange } = options;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await elasticityApi.getStatus(calculationId);
    onStatusChange?.(status);

    if (status.is_complete) {
      const calculation = await elasticityApi.getResults(calculationId);
      return { calculation, failed: false };
    }

    if (status.has_error) {
      // Return the FAILED calculation with error_message instead of throwing
      // This allows the UI to display the error message from the backend
      const calculation = await elasticityApi.getResults(calculationId);
      return { calculation, failed: true };
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
