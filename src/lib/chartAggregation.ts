/**
 * @deprecated This module is no longer used.
 * 
 * Chart data aggregation is now handled server-side via the
 * `/api/v1/market-data/aggregated/` endpoint. The frontend uses
 * `useAggregatedData` hook from `@/hooks` instead.
 * 
 * This file is kept for reference but can be safely deleted.
 * 
 * Migration: Use `useAggregatedData({ timeRange, granularity, source })` hook
 * which calls the backend aggregation service for optimal performance.
 * 
 * ---
 * OLD: Chart Data Aggregation Utilities (Client-side)
 * 
 * Provides functions to aggregate hourly market data into daily or weekly
 * summaries for cleaner chart visualization across different time ranges.
 */

export type AggregationMode = 'hourly' | 'daily' | 'weekly'
export type TimeRange = '24h' | '7d' | '30d' | '90d'

export interface AggregatedDataPoint {
  timestamp: number
  fullDate: Date
  sellPrice: number
  buyPrice: number
  volume: number
  premium: number
  quality: number
  // Aggregation metadata
  dataPointCount: number
  aggregationMode: AggregationMode
  periodStart: Date
  periodEnd: Date
}

export interface AggregationResult {
  data: AggregatedDataPoint[]
  aggregationMode: AggregationMode
  originalPointCount: number
  aggregatedPointCount: number
  coverageStart: Date | null
  coverageEnd: Date | null
}

/**
 * Get the ISO week number for a date
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Get a unique key for grouping data points
 */
function getGroupKey(date: Date, mode: AggregationMode): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  switch (mode) {
    case 'hourly':
      const hour = String(date.getHours()).padStart(2, '0')
      return `${year}-${month}-${day}T${hour}`
    case 'daily':
      return `${year}-${month}-${day}`
    case 'weekly':
      const week = getISOWeek(date)
      return `${year}-W${String(week).padStart(2, '0')}`
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * Get the start of period for a date based on aggregation mode
 */
function getPeriodStart(date: Date, mode: AggregationMode): Date {
  const result = new Date(date)
  
  switch (mode) {
    case 'hourly':
      result.setMinutes(0, 0, 0)
      break
    case 'daily':
      result.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      // Get Monday of the week
      const dayOfWeek = result.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      result.setDate(result.getDate() + diff)
      result.setHours(0, 0, 0, 0)
      break
  }
  
  return result
}

/**
 * Get the end of period for a date based on aggregation mode
 */
function getPeriodEnd(date: Date, mode: AggregationMode): Date {
  const result = new Date(date)
  
  switch (mode) {
    case 'hourly':
      result.setMinutes(59, 59, 999)
      break
    case 'daily':
      result.setHours(23, 59, 59, 999)
      break
    case 'weekly':
      // Get Sunday of the week
      const dayOfWeek = result.getDay()
      const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
      result.setDate(result.getDate() + diff)
      result.setHours(23, 59, 59, 999)
      break
  }
  
  return result
}

interface RawDataPoint {
  timestamp: Date
  averageSellPrice: number
  averageBuyPrice: number
  totalVolume: number
  spreadPercentage: number
  dataQualityScore: number
}

/**
 * Aggregate market data by the specified mode
 * 
 * @param rawData - Array of parsed market snapshots
 * @param mode - Aggregation mode: 'hourly', 'daily', or 'weekly'
 * @param officialRate - BCB official rate for calculating premium
 * @returns Aggregated data points with metadata
 */
export function aggregateMarketData(
  rawData: RawDataPoint[],
  mode: AggregationMode,
  officialRate: number = 6.96
): AggregationResult {
  if (!rawData.length) {
    return {
      data: [],
      aggregationMode: mode,
      originalPointCount: 0,
      aggregatedPointCount: 0,
      coverageStart: null,
      coverageEnd: null,
    }
  }

  // Sort by timestamp first
  const sortedData = [...rawData].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )

  // For hourly mode, just pass through with minimal processing
  if (mode === 'hourly') {
    const data = sortedData.map((item) => {
      const premium = officialRate > 0
        ? ((item.averageSellPrice - officialRate) / officialRate) * 100
        : 0

      return {
        timestamp: item.timestamp.getTime(),
        fullDate: item.timestamp,
        sellPrice: item.averageSellPrice,
        buyPrice: item.averageBuyPrice,
        volume: item.totalVolume,
        premium,
        quality: item.dataQualityScore * 100,
        dataPointCount: 1,
        aggregationMode: mode,
        periodStart: getPeriodStart(item.timestamp, mode),
        periodEnd: getPeriodEnd(item.timestamp, mode),
      }
    })

    return {
      data,
      aggregationMode: mode,
      originalPointCount: rawData.length,
      aggregatedPointCount: data.length,
      coverageStart: sortedData[0].timestamp,
      coverageEnd: sortedData[sortedData.length - 1].timestamp,
    }
  }

  // Group data by period
  const groups = new Map<string, RawDataPoint[]>()
  
  for (const item of sortedData) {
    const key = getGroupKey(item.timestamp, mode)
    const group = groups.get(key) || []
    group.push(item)
    groups.set(key, group)
  }

  // Aggregate each group
  const aggregated: AggregatedDataPoint[] = []
  
  for (const [_key, items] of groups.entries()) {
    // Calculate aggregates
    const avgSellPrice = items.reduce((sum, i) => sum + i.averageSellPrice, 0) / items.length
    const avgBuyPrice = items.reduce((sum, i) => sum + i.averageBuyPrice, 0) / items.length
    const totalVolume = items.reduce((sum, i) => sum + i.totalVolume, 0)
    const avgQuality = items.reduce((sum, i) => sum + i.dataQualityScore, 0) / items.length
    
    // Use the last timestamp in the group as representative
    const lastItem = items[items.length - 1]
    const firstItem = items[0]
    
    const premium = officialRate > 0
      ? ((avgSellPrice - officialRate) / officialRate) * 100
      : 0

    aggregated.push({
      timestamp: lastItem.timestamp.getTime(),
      fullDate: lastItem.timestamp,
      sellPrice: avgSellPrice,
      buyPrice: avgBuyPrice,
      volume: totalVolume,
      premium,
      quality: avgQuality * 100,
      dataPointCount: items.length,
      aggregationMode: mode,
      periodStart: getPeriodStart(firstItem.timestamp, mode),
      periodEnd: getPeriodEnd(lastItem.timestamp, mode),
    })
  }

  // Sort by timestamp
  aggregated.sort((a, b) => a.timestamp - b.timestamp)

  return {
    data: aggregated,
    aggregationMode: mode,
    originalPointCount: rawData.length,
    aggregatedPointCount: aggregated.length,
    coverageStart: sortedData[0].timestamp,
    coverageEnd: sortedData[sortedData.length - 1].timestamp,
  }
}

/**
 * Get the default aggregation mode for a time range
 */
export function getDefaultAggregation(timeRange: TimeRange): AggregationMode {
  switch (timeRange) {
    case '24h':
      return 'hourly'
    case '7d':
      return 'daily'
    case '30d':
      return 'daily'
    case '90d':
      return 'daily' // Could be 'weekly' for very dense data
    default:
      return 'daily'
  }
}

/**
 * Check if a granularity option is valid for a time range
 */
export function isValidGranularity(timeRange: TimeRange, granularity: AggregationMode): boolean {
  // All granularities are technically valid, but some don't make sense
  // e.g., weekly for 24h would result in just 1 point
  switch (timeRange) {
    case '24h':
      return granularity === 'hourly' // Only hourly makes sense for 24h
    case '7d':
      return granularity !== 'weekly' // Weekly would give just 1-2 points
    case '30d':
      return true // All options make sense
    case '90d':
      return true // All options make sense
    default:
      return true
  }
}

/**
 * Format a date for X-axis display based on aggregation mode
 */
export function formatAxisLabel(timestamp: number, mode: AggregationMode, timeRange: TimeRange): string {
  const date = new Date(timestamp)
  
  switch (mode) {
    case 'hourly':
      if (timeRange === '24h') {
        return date.toLocaleTimeString('es-BO', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      }
      // For longer ranges with hourly, show date + time
      return date.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        hour12: false
      }).replace(',', '')
      
    case 'daily':
      return date.toLocaleDateString('es-BO', { 
        day: '2-digit', 
        month: 'short' 
      })
      
    case 'weekly':
      const weekNum = getISOWeek(date)
      return `Sem ${weekNum}`
      
    default:
      return date.toLocaleDateString('es-BO')
  }
}

/**
 * Format tooltip label based on aggregation mode
 */
export function formatTooltipLabel(point: AggregatedDataPoint): string {
  const { aggregationMode, periodStart, periodEnd, dataPointCount } = point
  
  switch (aggregationMode) {
    case 'hourly':
      return periodStart.toLocaleString('es-BO', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
    case 'daily':
      const dateStr = periodStart.toLocaleDateString('es-BO', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
      return `${dateStr} (${dataPointCount} registros)`
      
    case 'weekly':
      const weekStart = periodStart.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
      const weekEnd = periodEnd.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
      return `Semana: ${weekStart} - ${weekEnd} (${dataPointCount} registros)`
      
    default:
      return periodStart.toLocaleString('es-BO')
  }
}

/**
 * Get label suffix for legend based on aggregation mode
 */
export function getAggregationLegendSuffix(mode: AggregationMode): string {
  switch (mode) {
    case 'hourly':
      return ''
    case 'daily':
      return ' (prom. diario)'
    case 'weekly':
      return ' (prom. semanal)'
    default:
      return ''
  }
}

/**
 * Calculate coverage statistics
 */
export interface CoverageStats {
  availableDays: number
  requestedDays: number
  coveragePercent: number
  startDate: string
  endDate: string
  isPartial: boolean
}

export function calculateCoverageStats(
  result: AggregationResult,
  timeRange: TimeRange
): CoverageStats | null {
  if (!result.coverageStart || !result.coverageEnd) {
    return null
  }

  const requestedDaysMap: Record<TimeRange, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
  }

  const msPerDay = 24 * 60 * 60 * 1000
  const actualMs = result.coverageEnd.getTime() - result.coverageStart.getTime()
  const availableDays = Math.ceil(actualMs / msPerDay) + 1
  const requestedDays = requestedDaysMap[timeRange]
  const coveragePercent = Math.min(100, (availableDays / requestedDays) * 100)

  return {
    availableDays,
    requestedDays,
    coveragePercent,
    startDate: result.coverageStart.toLocaleDateString('es-BO', { 
      day: '2-digit', 
      month: 'short' 
    }),
    endDate: result.coverageEnd.toLocaleDateString('es-BO', { 
      day: '2-digit', 
      month: 'short' 
    }),
    isPartial: availableDays < requestedDays,
  }
}
