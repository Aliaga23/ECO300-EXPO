import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectOption } from '@/components/ui/select'
import { useAggregatedData, formatDataSource } from '@/hooks'
import { useBCBRateContext, formatRateType } from '@/contexts/BCBRateContext'
import type { TimeRange, Granularity } from '@/types/api'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Bar,
  ComposedChart,
} from 'recharts'
import { TrendingUp, RefreshCw, Download, Info, Clock, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

// Chart colors
const CHART_COLORS = {
  buyPrice: '#22c55e',    // Green for buy price
  sellPrice: '#ef4444',   // Red for sell price
  premium: '#3b82f6',     // Blue for premium
  officialRate: '#f59e0b', // Amber for BCB rate
  volume: '#8b5cf6',      // Purple for volume
  grid: '#374151',        // Gray for grid
  text: '#9ca3af',        // Muted text
}

// Granularity labels in Spanish
const GRANULARITY_LABELS: Record<Granularity, string> = {
  hourly: 'Por Hora',
  daily: 'Por Día',
  weekly: 'Por Semana',
}

// Get default granularity for a time range
function getDefaultGranularity(timeRange: TimeRange): Granularity {
  switch (timeRange) {
    case '24h': return 'hourly'
    case '7d': return 'daily'
    case '30d': return 'daily'
    case '90d': return 'daily'
    default: return 'daily'
  }
}

// Check if granularity is valid for time range
function isValidGranularity(timeRange: TimeRange, granularity: Granularity): boolean {
  if (timeRange === '24h') return granularity === 'hourly'
  if (timeRange === '7d') return granularity !== 'weekly'
  return true
}

// Format timestamp for X-axis based on granularity
function formatAxisLabel(timestamp: string, granularity: Granularity): string {
  const date = new Date(timestamp)
  
  switch (granularity) {
    case 'hourly':
      return date.toLocaleTimeString('es-BO', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    case 'daily':
      return date.toLocaleDateString('es-BO', { 
        day: '2-digit', 
        month: 'short' 
      })
    case 'weekly':
      return date.toLocaleDateString('es-BO', { 
        day: '2-digit', 
        month: 'short' 
      })
    default:
      return date.toLocaleDateString('es-BO')
  }
}

// Format tooltip date with full detail
function formatTooltipDate(timestamp: string, granularity: Granularity, recordCount: number): string {
  const date = new Date(timestamp)
  
  if (granularity === 'hourly') {
    return date.toLocaleString('es-BO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  const dateStr = date.toLocaleDateString('es-BO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  
  return `${dateStr} (${recordCount} registros)`
}

export function HistoricalChart() {
  const { selectedRateType, currentRate } = useBCBRateContext()
  
  // Extract the sell price from the selected rate for calculations
  const selectedRateNumber = currentRate ? parseFloat(currentRate.sell) : 0
  
  // State for controls
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [granularity, setGranularity] = useState<Granularity>('daily')
  const [showVolume, setShowVolume] = useState(false)
  const [showPremium, setShowPremium] = useState(true)
  const [showOfficialRate, setShowOfficialRate] = useState(true)

  // Fetch aggregated data from backend (all sources: P2P + OHLC)
  const { data: aggregatedData, loading, error, refresh } = useAggregatedData({
    timeRange,
    granularity,
    source: 'all', // Combine P2P and OHLC data for complete coverage
  })

  // Auto-update granularity when time range changes
  useEffect(() => {
    const defaultGranularity = getDefaultGranularity(timeRange)
    setGranularity(defaultGranularity)
  }, [timeRange])

  // Transform backend data to chart format
  const chartData = useMemo(() => {
    if (!aggregatedData?.points) return []
    
    return aggregatedData.points.map((point) => {
      // Calculate premium from selected BCB rate
      const premium = selectedRateNumber > 0 
        ? ((point.average_sell_price - selectedRateNumber) / selectedRateNumber) * 100 
        : 0
      
      return {
        timestamp: point.timestamp,
        sellPrice: point.average_sell_price,
        buyPrice: point.average_buy_price,
        volume: point.total_volume,
        spread: point.spread_percentage,
        recordCount: point.record_count,
        premium,
        officialRate: selectedRateNumber, // Use selected rate for reference line
      }
    })
  }, [aggregatedData?.points, selectedRateNumber])

  // Calculate tick interval based on data density
  const tickInterval = useMemo(() => {
    const len = chartData.length
    if (len <= 10) return 0
    if (len <= 20) return 1
    return Math.max(1, Math.floor(len / 12))
  }, [chartData.length])

  // X-axis tick formatter
  const formatXAxisTick = useCallback((timestamp: string) => {
    return formatAxisLabel(timestamp, granularity)
  }, [granularity])

  // Custom tooltip label formatter
  const getTooltipLabel = (payload: unknown): string => {
    const items = payload as Array<{ payload?: { timestamp: string; recordCount: number } }>
    if (items && items[0]?.payload) {
      return formatTooltipDate(items[0].payload.timestamp, granularity, items[0].payload.recordCount)
    }
    return ''
  }

  // Handle granularity change with validation
  const handleGranularityChange = (value: Granularity) => {
    if (isValidGranularity(timeRange, value)) {
      setGranularity(value)
    }
  }

  // Legend suffix based on aggregation
  const legendSuffix = granularity === 'hourly' ? '' : 
    granularity === 'daily' ? ' (prom. diario)' : ' (prom. semanal)'

  const exportChart = () => {
    if (!aggregatedData) return
    
    const modeLabel = GRANULARITY_LABELS[granularity]
    const headers = ['Fecha', 'Precio Venta', 'Precio Compra', 'Volumen', 'Spread (%)', 'Registros']
    const rows = chartData.map((d) => [
      d.timestamp,
      d.sellPrice.toFixed(2),
      d.buyPrice.toFixed(2),
      d.volume.toFixed(0),
      d.spread.toFixed(2),
      d.recordCount,
    ])
    
    const csv = [
      [`# Exportación ${modeLabel} - Rango: ${timeRange} - Fuente: ${aggregatedData.data_source}`],
      headers,
      ...rows
    ].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usdt-bob-history-${timeRange}-${granularity}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Coverage info from backend
  const coverageInfo = useMemo(() => {
    if (!aggregatedData) return null
    
    const requestedDays: Record<TimeRange, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    }
    
    const isPartial = aggregatedData.span_days < requestedDays[timeRange]
    const startDate = new Date(aggregatedData.coverage_start).toLocaleDateString('es-BO', { 
      day: '2-digit', 
      month: 'short' 
    })
    const endDate = new Date(aggregatedData.coverage_end).toLocaleDateString('es-BO', { 
      day: '2-digit', 
      month: 'short' 
    })
    
    return {
      isPartial,
      spanDays: Math.round(aggregatedData.span_days),
      requestedDays: requestedDays[timeRange],
      startDate,
      endDate,
      dataSource: aggregatedData.data_source,
      totalRecords: aggregatedData.total_records,
      aggregatedPoints: aggregatedData.aggregated_points,
    }
  }, [aggregatedData, timeRange])

  if (loading && !aggregatedData) {
    return <ChartSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state when no data available
  if (!loading && (!aggregatedData || aggregatedData.aggregated_points === 0)) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Historial de Precios USDT/BOB</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No hay datos disponibles para este periodo y resolución.</p>
            <p className="text-sm mt-2">
              Intenta seleccionar un rango de tiempo diferente o cambiar la granularidad.
            </p>
            <Button variant="outline" className="mt-4" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar Datos
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Historial de Precios USDT/BOB</CardTitle>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex rounded-lg border p-1">
              {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3 py-1 h-7"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>

            {/* Granularity Selector */}
            <Select 
              value={granularity} 
              onChange={(e) => handleGranularityChange(e.target.value as Granularity)}
              className="w-[120px] h-8 text-xs"
            >
              <SelectOption 
                value="hourly" 
                disabled={!isValidGranularity(timeRange, 'hourly')}
              >
                {GRANULARITY_LABELS.hourly}
              </SelectOption>
              <SelectOption 
                value="daily"
                disabled={!isValidGranularity(timeRange, 'daily')}
              >
                {GRANULARITY_LABELS.daily}
              </SelectOption>
              <SelectOption 
                value="weekly"
                disabled={!isValidGranularity(timeRange, 'weekly')}
              >
                {GRANULARITY_LABELS.weekly}
              </SelectOption>
            </Select>

            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={exportChart} title="Exportar CSV">
              <Download className="h-4 w-4" />
            </Button>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              disabled={loading}
              title="Actualizar datos"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Coverage Indicator */}
        {coverageInfo && coverageInfo.isPartial && (
          <div className="flex items-center gap-2 mt-3 p-2 rounded-md bg-muted/50 border border-muted">
            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Mostrando <strong>{coverageInfo.spanDays} días</strong> de {coverageInfo.requestedDays} solicitados.
              Datos disponibles desde <strong>{coverageInfo.startDate}</strong> hasta <strong>{coverageInfo.endDate}</strong>.
            </p>
          </div>
        )}

        {/* Data Source Badge */}
        {coverageInfo && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              Fuente: {formatDataSource(coverageInfo.dataSource)}
            </Badge>
          </div>
        )}

        {/* Legend Toggles */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge
            variant={showOfficialRate ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setShowOfficialRate(!showOfficialRate)}
          >
            Tasa {formatRateType(selectedRateType)} BCB
          </Badge>
          <Badge
            variant={showPremium ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setShowPremium(!showPremium)}
          >
            Prima (%)
          </Badge>
          <Badge
            variant={showVolume ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setShowVolume(!showVolume)}
          >
            Volumen
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6">
        <div className="h-[280px] sm:h-80 md:h-96 lg:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} opacity={0.3} />
              <XAxis
                dataKey="timestamp"
                stroke={CHART_COLORS.text}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickFormatter={formatXAxisTick}
                interval={tickInterval}
                angle={granularity === 'hourly' && timeRange !== '24h' ? -35 : 0}
                textAnchor={granularity === 'hourly' && timeRange !== '24h' ? 'end' : 'middle'}
                height={granularity === 'hourly' && timeRange !== '24h' ? 50 : 30}
              />
              <YAxis
                yAxisId="price"
                stroke={CHART_COLORS.text}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
                domain={['auto', 'auto']}
                label={{ 
                  value: 'Precio (BOB)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: CHART_COLORS.text, fontSize: 11 }
                }}
              />
              {showPremium && !showVolume && (
                <YAxis
                  yAxisId="premium"
                  orientation="right"
                  stroke={CHART_COLORS.text}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  domain={['auto', 'auto']}
                  label={{ 
                    value: 'Prima (%)', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { fill: CHART_COLORS.text, fontSize: 11 }
                  }}
                />
              )}
              {showVolume && (
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  stroke={CHART_COLORS.text}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  domain={[0, 'auto']}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                    if (value >= 1000) return `${(value/1000).toFixed(0)}k`
                    return value
                  }}
                  label={{ 
                    value: granularity === 'hourly' ? 'Volumen (USDT)' : 'Volumen Total (USDT)', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { fill: CHART_COLORS.text, fontSize: 11 }
                  }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f3f4f6',
                }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '4px' }}
                labelFormatter={(_, payload) => getTooltipLabel(payload)}
                formatter={(value: number, name: string) => {
                  const suffix = granularity !== 'hourly' ? ` (${granularity === 'daily' ? 'diario' : 'semanal'})` : ''
                  if (name.includes('Volumen')) {
                    const label = granularity === 'hourly' ? name : `Volumen total${suffix}`
                    return [`${value.toLocaleString('es-BO')} USDT`, label]
                  }
                  if (name.includes('Prima')) {
                    const label = granularity === 'hourly' ? name : `Prima prom.${suffix}`
                    return [`${value.toFixed(2)}%`, label]
                  }
                  const label = granularity === 'hourly' ? name : `${name.replace(legendSuffix, '')} prom.${suffix}`
                  return [`${value.toFixed(2)} BOB`, label]
                }}
              />
              <Legend wrapperStyle={{ color: CHART_COLORS.text }} />

              {/* P2P Sell Price Line */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sellPrice"
                stroke={CHART_COLORS.sellPrice}
                strokeWidth={2}
                dot={chartData.length <= 15}
                name={`Precio P2P Venta${legendSuffix}`}
                activeDot={{ r: 4, stroke: CHART_COLORS.sellPrice }}
              />

              {/* P2P Buy Price Line */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="buyPrice"
                stroke={CHART_COLORS.buyPrice}
                strokeWidth={2}
                dot={chartData.length <= 15}
                name={`Precio P2P Compra${legendSuffix}`}
                activeDot={{ r: 4, stroke: CHART_COLORS.buyPrice }}
              />

              {/* Official Rate */}
              {showOfficialRate && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="officialRate"
                  stroke={CHART_COLORS.officialRate}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Tasa ${formatRateType(selectedRateType)} BCB`}
                  activeDot={{ r: 4, stroke: CHART_COLORS.officialRate }}
                />
              )}

              {/* Premium Area */}
              {showPremium && !showVolume && (
                <Area
                  yAxisId="premium"
                  type="monotone"
                  dataKey="premium"
                  fill={CHART_COLORS.premium}
                  fillOpacity={0.2}
                  stroke={CHART_COLORS.premium}
                  strokeWidth={1}
                  name={granularity === 'hourly' ? 'Prima (%)' : 'Prima prom. (%)'}
                />
              )}
              
              {/* Volume Bars */}
              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill={CHART_COLORS.volume}
                  fillOpacity={0.7}
                  name={granularity === 'hourly' ? 'Volumen' : 'Volumen total'}
                  radius={[2, 2, 0, 0]}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4 pt-4 border-t">
          <StatItem
            label="Precio Actual"
            value={`${chartData.at(-1)?.sellPrice.toFixed(2) || 'N/A'} BOB`}
          />
          <StatItem
            label="Prima Actual"
            value={`${chartData.at(-1)?.premium.toFixed(1) || 'N/A'}%`}
          />
          <StatItem
            label="Resolución"
            value={GRANULARITY_LABELS[granularity]}
          />
          <StatItem
            label="Puntos"
            value={`${chartData.length} ${granularity === 'daily' ? 'días' : granularity === 'weekly' ? 'semanas' : 'horas'}`}
          />
          <StatItem
            label="Datos Originales"
            value={`${coverageInfo?.totalRecords || 0} registros`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-end space-x-2 p-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
