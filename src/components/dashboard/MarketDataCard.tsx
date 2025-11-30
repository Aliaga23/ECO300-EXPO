import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMarketData } from '@/hooks'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Format relative time from timestamp
function formatTimeAgo(timestamp: Date): string {
  const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000)
  if (seconds < 0) return 'Ahora'
  if (seconds < 60) return `Hace ${seconds}s`
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`
  return `Hace ${Math.floor(seconds / 86400)}d`
}

export function MarketDataCard() {
  const { snapshot, loading, error } = useMarketData()
  
  // State for live "time ago" updates
  const [timeAgo, setTimeAgo] = useState<string>('Actualizando...')

  // Update "time ago" every 30 seconds
  useEffect(() => {
    if (!snapshot) return

    // Initial update
    setTimeAgo(formatTimeAgo(snapshot.timestamp))

    // Update every 30s
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(snapshot.timestamp))
    }, 30000)

    return () => clearInterval(interval)
  }, [snapshot?.timestamp])

  // Use backend-computed price change - NO local calculations
  const priceChange = snapshot?.priceChangePercentage
  const priceDirection = snapshot?.priceChangeDirection
  const showPriceChange = priceChange !== null && priceChange !== undefined && !snapshot?.isFirstSnapshot

  // Memoized volume formatter
  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toFixed(0)
  }, [])

  // Memoized derived values
  const displayValues = useMemo(() => {
    if (!snapshot) return null
    return {
      sellPrice: snapshot.averageSellPrice.toFixed(2),
      buyPrice: snapshot.averageBuyPrice.toFixed(2),
      volume: formatVolume(snapshot.totalVolume),
      spread: snapshot.spreadPercentage.toFixed(2),
      quality: snapshot.dataQualityScore,
      qualityPercent: (snapshot.dataQualityScore * 100).toFixed(0),
      hasActiveTraders: snapshot.numActiveTraders > 0,
      activeTraders: snapshot.numActiveTraders,
    }
  }, [snapshot, formatVolume])

  // Get badge variant based on backend direction
  const getPriceChangeBadgeVariant = () => {
    if (!priceDirection || priceDirection === 'neutral') return 'secondary'
    return priceDirection === 'up' ? 'success' : 'destructive'
  }

  // Get icon based on backend direction  
  const PriceChangeIcon = priceDirection === 'up' ? TrendingUp 
    : priceDirection === 'down' ? TrendingDown 
    : Minus

  if (loading) {
    return <MarketDataSkeleton />
  }

  if (error || !snapshot || !displayValues) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{error || 'No hay datos de mercado disponibles'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Datos del Mercado P2P</CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Price Display */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Precio USDT/BOB</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">
                {displayValues.sellPrice}
              </span>
              <span className="text-lg text-muted-foreground">BOB</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {/* Price Change - using backend computed values directly */}
            {showPriceChange && priceChange !== null && priceChange !== undefined ? (
              <Badge
                variant={getPriceChangeBadgeVariant()}
                className="flex items-center gap-1 text-sm px-3 py-1"
              >
                <PriceChangeIcon className="h-4 w-4" />
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 text-sm px-3 py-1">
                <Minus className="h-4 w-4" />
                Sin cambios
              </Badge>
            )}
            {/* Time gap warning from backend */}
            {snapshot.timeGapWarning && snapshot.timeGapMinutes !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-warning flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      Hace {snapshot.timeGapMinutes}m
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Última actualización hace {snapshot.timeGapMinutes} minutos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!snapshot.timeGapWarning && (
              <span className="text-xs text-muted-foreground mt-1">
                {showPriceChange ? 'vs. última lectura' : 'Primera lectura'}
              </span>
            )}
          </div>
        </div>

        {/* Secondary Metrics Grid - 3 columns if no traders, 4 if traders exist */}
        <div className={cn(
          "grid gap-4",
          displayValues.hasActiveTraders ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"
        )}>
          <MetricItem
            icon={DollarSign}
            label="Precio Compra"
            value={`${displayValues.buyPrice} BOB`}
            color="text-green-500"
          />
          <MetricItem
            icon={DollarSign}
            label="Precio Venta"
            value={`${displayValues.sellPrice} BOB`}
            color="text-red-500"
          />
          <MetricItem
            icon={BarChart3}
            label="Volumen Total"
            value={`${displayValues.volume} USDT`}
            color="text-purple-500"
          />
          {/* Only show traders if > 0, otherwise show N/D indicator */}
          {displayValues.hasActiveTraders ? (
            <MetricItem
              icon={BarChart3}
              label="Traders Activos"
              value={displayValues.activeTraders.toString()}
              color="text-orange-500"
            />
          ) : null}
        </div>

        {/* Data Quality Indicator */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm text-muted-foreground">Calidad de Datos</span>
            <div className="flex items-center gap-2">
              <div className="w-20 sm:w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    displayValues.quality >= 0.8 ? 'bg-green-500' :
                    displayValues.quality >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${displayValues.quality * 100}%` }}
                />
              </div>
              <Badge
                variant={
                  displayValues.quality >= 0.8 ? 'success' :
                  displayValues.quality >= 0.5 ? 'warning' : 'destructive'
                }
                className="text-xs"
              >
                {displayValues.qualityPercent}%
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Spread: {displayValues.spread}% • 
            Actualización automática cada 30 segundos
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color?: string
}

function MetricItem({ icon: Icon, label, value, color }: MetricItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={cn('p-2 rounded-full bg-background', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function MarketDataSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
