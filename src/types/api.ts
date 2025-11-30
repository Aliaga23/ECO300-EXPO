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

// Latest Market Data with computed fields from backend
export type PriceChangeDirection = 'up' | 'down' | 'neutral';

export interface LatestMarketData {
  // Core snapshot fields
  id: number;
  timestamp: string;
  average_sell_price: string;
  average_buy_price: string;
  total_volume: string;
  spread_percentage: string;
  num_active_traders: number;
  data_quality_score: string;
  
  // Price change fields (computed by backend)
  price_change_percentage: number | null;
  price_change_direction: PriceChangeDirection | null;
  previous_price: number | null;
  is_first_snapshot: boolean;
  
  // Time gap warning
  time_gap_minutes: number | null;
  time_gap_warning: boolean;
  
  // BCB / Market premium fields
  market_premium_percentage: number | null;
  bcb_official_rate: number | null;
  bcb_rate_date: string | null;
  bcb_rate_stale: boolean;
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
// Aggregated Market Data Types (Backend-driven)
// ============================================

export type TimeRange = '24h' | '7d' | '30d' | '90d';
export type Granularity = 'hourly' | 'daily' | 'weekly';
export type DataSource = 'p2p' | 'ohlc' | 'all';

export interface AggregatedDataPoint {
  timestamp: string;
  average_buy_price: number;
  average_sell_price: number;
  total_volume: number;
  spread_percentage: number;
  record_count: number;
}

export interface AggregatedMarketDataResponse {
  time_range: TimeRange;
  granularity: Granularity;
  coverage_start: string;
  coverage_end: string;
  span_days: number;
  data_source: string;
  total_records: number;
  aggregated_points: number;
  points: AggregatedDataPoint[];
}

export interface AggregatedMarketDataRequest {
  time_range?: TimeRange;
  granularity?: Granularity;
  source?: DataSource;
  start_date?: string;
  end_date?: string;
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

// Data source information from backend
export interface DataSourceInfo {
  type: string; // e.g., "external_ohlc_api"
  timeframe?: string; // e.g., "1h"
  quality_score?: number;
}

export interface CalculationMetadata {
  source: string;
  currency_pair: string;
  data_source?: DataSourceInfo;
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
  classification_label?: string | null;
  confidence_interval_95: ConfidenceInterval | null;
  r_squared: string | null;
  standard_error: string | null;
  data_points_used: number | null;
  average_data_quality: string | null;
  is_significant: boolean | null;
  is_reliable?: boolean;
  reliability_note?: string | null;
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
  data_points_used?: number | null;
  calculation_metadata?: CalculationMetadata | null;
  error_message?: string | null;
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

// Parsed Latest Market Data with all computed fields
export interface ParsedLatestMarketData extends ParsedMarketSnapshot {
  // Price change fields (computed by backend)
  priceChangePercentage: number | null;
  priceChangeDirection: PriceChangeDirection | null;
  previousPrice: number | null;
  isFirstSnapshot: boolean;
  
  // Time gap warning
  timeGapMinutes: number | null;
  timeGapWarning: boolean;
  
  // BCB / Market premium fields
  marketPremiumPercentage: number | null;
  bcbOfficialRate: number | null;
  bcbRateDate: string | null;
  bcbRateStale: boolean;
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
  classificationLabel: string | null;
  confidenceInterval: ConfidenceInterval | null;
  rSquared: number | null;
  standardError: number | null;
  dataPointsUsed: number | null;
  averageDataQuality: number | null;
  isSignificant: boolean | null;
  isReliable: boolean;
  reliabilityNote: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  calculationMetadata: CalculationMetadata | null;
}

// ============================================
// OHLC Types (for future candlestick charts)
// ============================================

export interface OHLCCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OHLCBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MarketSnapshotRawResponse {
  source: string;
  timeframe: string;
  buy_candle?: OHLCCandle;
  sell_candle?: OHLCCandle;
}

export interface ExtendedMarketSnapshot extends MarketSnapshot {
  raw_response?: MarketSnapshotRawResponse;
}

// ============================================
// Data Coverage Types
// ============================================

export interface DataCoverage {
  min_date: string;
  max_date: string;
  total_snapshots: number;
  source: string;
}
