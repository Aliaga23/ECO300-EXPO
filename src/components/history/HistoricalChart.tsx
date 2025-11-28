import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useHistoricalData, useBCBRate } from '@/hooks'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts'
import { TrendingUp, RefreshCw, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimeRange = '24h' | '7d' | '30d' | '90d'

// Chart colors - using CSS custom properties via getComputedStyle at runtime
const CHART_COLORS = {
  buyPrice: '#22c55e',    // Green for buy price
  sellPrice: '#ef4444',   // Red for sell price
  premium: '#3b82f6',     // Blue for premium
  officialRate: '#f59e0b', // Amber for BCB rate
  grid: '#374151',        // Gray for grid
  text: '#9ca3af',        // Muted text
}

// Helper function declared BEFORE usage to avoid Temporal Dead Zone error
const formatDate = (date: Date, range: TimeRange): string => {
  if (range === '24h') {
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
  } else if (range === '7d') {
    return date.toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit' })
  } else {
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
  }
}

export function HistoricalChart() {
  const { data, loading, error, refresh } = useHistoricalData()
  const { officialRate } = useBCBRate()
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [showVolume, setShowVolume] = useState(false)
  const [showPremium, setShowPremium] = useState(true)
  const [showOfficialRate, setShowOfficialRate] = useState(true)

  const filteredData = useMemo(() => {
    if (!data.length) return []

    const now = new Date()
    const rangeMs: Record<TimeRange, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    }

    const cutoff = now.getTime() - rangeMs[timeRange]
    
    return data
      .filter((item) => item.timestamp.getTime() >= cutoff)
      .map((item) => {
        const premium = officialRate > 0 
          ? ((item.averageSellPrice - officialRate) / officialRate) * 100 
          : 0
        
        return {
          timestamp: item.timestamp.getTime(),
          date: formatDate(item.timestamp, timeRange),
          fullDate: item.timestamp,
          sellPrice: item.averageSellPrice,
          buyPrice: item.averageBuyPrice,
          volume: item.totalVolume,
          officialRate,
          premium,
          quality: item.dataQualityScore * 100,
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [data, timeRange, officialRate])

  const exportChart = () => {
    // Simple CSV export
    const headers = ['Fecha', 'Precio Venta', 'Precio Compra', 'Volumen', 'Prima (%)']
    const rows = filteredData.map((d) => [
      d.fullDate.toISOString(),
      d.sellPrice.toFixed(2),
      d.buyPrice.toFixed(2),
      d.volume.toFixed(0),
      d.premium.toFixed(2),
    ])
    
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usdt-bob-history-${timeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !data.length) {
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

  // Empty state when no data matches the filter
  if (!loading && filteredData.length === 0) {
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
            <p>No hay datos disponibles para el período seleccionado.</p>
            <p className="text-sm mt-2">Intenta seleccionar un rango de tiempo diferente.</p>
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

            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={exportChart}>
              <Download className="h-4 w-4" />
            </Button>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              disabled={loading}
              className={cn(loading && 'animate-spin')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend Toggles */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant={showOfficialRate ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setShowOfficialRate(!showOfficialRate)}
          >
            Tasa Oficial BCB
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

      <CardContent>
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke={CHART_COLORS.text}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
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
              {showPremium && (
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
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f3f4f6',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]?.payload?.fullDate) {
                    return payload[0].payload.fullDate.toLocaleString('es-BO')
                  }
                  return ''
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
                dot={false}
                name="Precio P2P Venta"
                activeDot={{ r: 4, stroke: CHART_COLORS.sellPrice }}
              />

              {/* P2P Buy Price Line */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="buyPrice"
                stroke={CHART_COLORS.buyPrice}
                strokeWidth={2}
                dot={false}
                name="Precio P2P Compra"
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
                  name="Tasa Oficial BCB"
                  activeDot={{ r: 4, stroke: CHART_COLORS.officialRate }}
                />
              )}

              {/* Premium Area */}
              {showPremium && (
                <Area
                  yAxisId="premium"
                  type="monotone"
                  dataKey="premium"
                  fill={CHART_COLORS.premium}
                  fillOpacity={0.2}
                  stroke={CHART_COLORS.premium}
                  strokeWidth={1}
                  name="Prima (%)"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <StatItem
            label="Precio Actual"
            value={`${filteredData.at(-1)?.sellPrice.toFixed(2) || 'N/A'} BOB`}
          />
          <StatItem
            label="Prima Actual"
            value={`${filteredData.at(-1)?.premium.toFixed(1) || 'N/A'}%`}
          />
          <StatItem
            label="Datos"
            value={`${filteredData.length} puntos`}
          />
          <StatItem
            label="Período"
            value={timeRange}
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
