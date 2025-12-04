import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMarketData } from '@/hooks'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Fixed card height constant - must match BCBRateCard for layout consistency
const CARD_HEIGHT = 'h-[420px]'

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
  const { snapshot, loading, error, refresh } = useMarketData()
  
  // State for live "time ago" updates
  const [timeAgo, setTimeAgo] = useState<string>('Actualizando...')

  // Update "time ago" every 30 seconds (display refresh, not data fetch)
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
      <Card className={`${CARD_HEIGHT} flex flex-col`}>
        <CardHeader className="pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Datos del Mercado P2P</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{error || 'No hay datos de mercado disponibles'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get quality color class
  const getQualityColor = () => {
    if (displayValues.quality >= 0.8) return 'text-green-600 dark:text-green-500'
    if (displayValues.quality >= 0.5) return 'text-yellow-600 dark:text-yellow-500'
    return 'text-red-600 dark:text-red-500'
  }

  return (
    <Card className={`${CARD_HEIGHT} flex flex-col`}>
      {/* Header - Fixed height h-12 (48px) */}
      <CardHeader className="h-12 flex items-center shrink-0 py-0 px-4">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-lg font-semibold truncate">Datos del Mercado P2P</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={refresh}
                    disabled={loading}
                    className="h-7 w-7"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actualizar datos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs text-muted-foreground hidden sm:inline">Binance P2P</span>
            <span className={cn('text-xs font-medium', getQualityColor())}>
              {displayValues.qualityPercent}%
            </span>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {timeAgo}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Content - Optimized heights to fit in 420px card */}
      <CardContent className="flex-1 grid grid-rows-1 px-4 pb-3 pt-1">
        <div className="place-self-center w-full">
          {/* Main Price Display - Fixed height 60px */}
          <div className="h-[60px] flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Precio USDT/BOB</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {displayValues.sellPrice}
              </span>
              <span className="text-sm text-muted-foreground">BOB</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {showPriceChange && priceChange !== null && priceChange !== undefined ? (
              <Badge
                variant={getPriceChangeBadgeVariant()}
                className="flex items-center gap-1 text-sm px-3 py-1"
              >
                <PriceChangeIcon className="h-4 w-4" />
                {priceChange.toFixed(2)}%
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 text-sm px-3 py-1">
                <Minus className="h-4 w-4" />
                Sin cambios
              </Badge>
            )}
            {snapshot.timeGapWarning && snapshot.timeGapMinutes !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-warning flex items-center gap-1">
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
          </div>
        </div>

        {/* Buy/Sell/Spread - Fixed height 90px */}
        <div className="h-[90px] bg-muted/30 rounded-lg p-3 flex flex-col justify-center shrink-0 mt-1">
          <div className="flex items-center justify-between text-sm h-7">
            <span className="text-muted-foreground text-left">Compra</span>
            <span className="font-semibold text-green-600 dark:text-green-500 text-right">
              {displayValues.buyPrice} BOB
            </span>
          </div>
          <div className="flex items-center justify-between text-sm h-7">
            <span className="text-muted-foreground text-left">Venta</span>
            <span className="font-semibold text-red-600 dark:text-red-500 text-right">
              {displayValues.sellPrice} BOB
            </span>
          </div>
          <div className="flex items-center justify-between text-sm h-7 pt-1 border-t border-border/50">
            <span className="text-muted-foreground text-left">Spread</span>
            <span className="font-medium text-muted-foreground text-right">{displayValues.spread}%</span>
          </div>
        </div>

        {/* Volume and Traders - Fixed height 48px */}
        <div className="h-[48px] grid grid-cols-2 gap-2 shrink-0 mt-1">
          <div className="bg-muted/20 rounded-lg flex flex-col items-center justify-center">
            <div className="text-xs text-muted-foreground">Volumen</div>
            <div className="font-semibold text-sm">{displayValues.volume} USDT</div>
          </div>
          <div className="bg-muted/20 rounded-lg flex flex-col items-center justify-center">
            <div className="text-xs text-muted-foreground">Traders Activos</div>
            <div className="font-semibold text-sm">{displayValues.activeTraders}</div>
          </div>
        </div>

        {/* Previous Price - Fixed height 40px */}
        <div className="h-[40px] bg-muted/20 rounded-lg flex items-center px-3 shrink-0 mt-1">
          <div className="flex items-center justify-between text-sm w-full">
            <span className="text-muted-foreground text-left">Precio Anterior</span>
            <span className="font-semibold text-right">
              {snapshot?.previousPrice ? snapshot.previousPrice.toFixed(2) : 'N/D'} BOB
            </span>
          </div>
        </div>

        {/* Footer - Fixed height 32px */}
          <div className="h-8 flex items-center justify-center border-t border-border shrink-0">
            <p className="text-xs text-muted-foreground">
              Binance P2P es actualizado cada 10 minutos
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MarketDataSkeleton() {
  return (
    <Card className={`${CARD_HEIGHT} flex flex-col`}>
      {/* Header - Fixed height h-12 */}
      <CardHeader className="h-12 flex items-center shrink-0 py-0 px-4">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 hidden sm:block" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
        </div>
      </CardHeader>

      {/* Content - Optimized heights */}
      <CardContent className="flex-1 grid grid-rows-1 px-4 pb-3 pt-1">
        <div className="place-self-center w-full">
          {/* Main price - h-[60px] */}
          <div className="h-[60px] flex items-center justify-between shrink-0">
          <div>
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-7 w-24 rounded" />
        </div>

        {/* Buy/Sell/Spread - h-[90px] */}
        <div className="h-[90px] bg-muted/30 rounded-lg p-3 flex flex-col justify-center shrink-0 mt-1">
          <div className="flex justify-between h-7 items-center">
            <Skeleton className="h-4 w-16 text-left" />
            <Skeleton className="h-4 w-20 text-right" />
          </div>
          <div className="flex justify-between h-7 items-center">
            <Skeleton className="h-4 w-16 text-left" />
            <Skeleton className="h-4 w-20 text-right" />
          </div>
          <div className="flex justify-between h-7 items-center pt-1 border-t border-border/50">
            <Skeleton className="h-4 w-16 text-left" />
            <Skeleton className="h-4 w-16 text-right" />
          </div>
        </div>

        {/* Volume/Traders - h-[48px] */}
        <div className="h-[48px] grid grid-cols-2 gap-2 shrink-0 mt-1">
          <div className="bg-muted/20 rounded-lg flex flex-col items-center justify-center">
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="bg-muted/20 rounded-lg flex flex-col items-center justify-center">
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>

        {/* Previous Price - h-[40px] */}
        <div className="h-[40px] bg-muted/20 rounded-lg flex items-center px-3 shrink-0 mt-1">
          <div className="flex justify-between w-full">
            <Skeleton className="h-4 w-24 text-left" />
            <Skeleton className="h-4 w-20 text-right" />
          </div>
        </div>

        {/* Footer - h-8 */}
          <div className="h-8 flex items-center justify-center border-t border-border shrink-0">
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
