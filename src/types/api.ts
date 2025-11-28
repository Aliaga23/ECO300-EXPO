// API Types for ElasticBot Django Backend

// ============================================
// Market Data Types
// ============================================

export interface MarketSnapshot {
  id: number;
  timestamp: string;
  average_sell_price: string;
  average_buy_price: string;
  total_volume: string;
  spread_percentage: string;
  num_active_traders: number;
  data_quality_score: string;
}

export interface MacroeconomicIndicator {
  id: number;
  date: string;
  official_exchange_rate: string;
  monthly_inflation_rate: string | null;
  accumulated_inflation: string | null;
  source: string;
  raw_data: {
    venta: string;
    compra: string;
    url: string;
    scraped_at: string;
  };
  created_at: string;
}

// ============================================
// Elasticity Calculation Types
// ============================================

export type CalculationMethod = 'midpoint' | 'regression';
export type WindowSize = 'hourly' | 'daily' | 'weekly';
export type CalculationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ElasticityClassification = 'ELASTIC' | 'INELASTIC' | 'UNITARY';

export interface CalculationRequest {
  method: CalculationMethod;
  start_date: string;
  end_date: string;
  window_size: WindowSize;
}

export interface CalculationStatusResponse {
  id: string;
  status: CalculationStatus;
  is_complete: boolean;
  has_error: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}

export interface CalculationMetadata {
  source: string;
  currency_pair: string;
}

export interface ElasticityCalculation {
  id: string;
  status: CalculationStatus;
  method: CalculationMethod;
  start_date: string;
  end_date: string;
  window_size: WindowSize;
  elasticity_coefficient: string | null;
  elasticity_magnitude?: number;
  classification: ElasticityClassification | null;
  confidence_interval_95: ConfidenceInterval | null;
  r_squared: string | null;
  standard_error: string | null;
  data_points_used: number | null;
  average_data_quality: string | null;
  is_significant: boolean | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  calculation_metadata: CalculationMetadata | null;
}

export interface CalculationSummary {
  id: string;
  status: CalculationStatus;
  method: CalculationMethod;
  elasticity_coefficient: string | null;
  classification: ElasticityClassification | null;
  created_at: string;
}

// ============================================
// AI Interpretation Types
// ============================================

export interface InterpretationRequest {
  calculation_id: string;
}

export interface InterpretationResponse {
  calculation_id: string;
  interpretation: string;
  generated_at: string;
  cached: boolean;
  model: string;
}

// ============================================
// Scenario Simulator Types
// ============================================

export interface ScenarioRequest {
  price_initial: string;
  price_final: string;
  quantity_initial: string;
  quantity_final: string;
}

export interface ScenarioResponse {
  elasticity: number;
  abs_value: number;
  classification: 'elastic' | 'inelastic' | 'unitary';
  percentage_change_quantity: number;
  percentage_change_price: number;
  quantity_change: number;
  price_change: number;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================
// Error Types
// ============================================

export interface APIError {
  error: string;
  detail: string | Record<string, string[]>;
  retry_after?: number;
}

// ============================================
// Rate Limit Types
// ============================================

export interface RateLimitState {
  marketData: { remaining: number; reset: Date | null };
  elasticity: { remaining: number; reset: Date | null };
  interpretation: { remaining: number; reset: Date | null };
  simulator: { remaining: number; reset: Date | null };
  reports: { remaining: number; reset: Date | null };
}

// ============================================
// Parsed/Computed Types (for frontend use)
// ============================================

export interface ParsedMarketSnapshot {
  id: number;
  timestamp: Date;
  averageSellPrice: number;
  averageBuyPrice: number;
  totalVolume: number;
  spreadPercentage: number;
  numActiveTraders: number;
  dataQualityScore: number;
}

export interface ParsedElasticityCalculation {
  id: string;
  status: CalculationStatus;
  method: CalculationMethod;
  startDate: Date;
  endDate: Date;
  windowSize: WindowSize;
  elasticityCoefficient: number | null;
  elasticityMagnitude: number | null;
  classification: ElasticityClassification | null;
  confidenceInterval: ConfidenceInterval | null;
  rSquared: number | null;
  standardError: number | null;
  dataPointsUsed: number | null;
  averageDataQuality: number | null;
  isSignificant: boolean | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}
