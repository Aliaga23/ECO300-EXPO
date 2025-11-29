import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarketData } from '@/hooks'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Local storage key for persisting last price
const LAST_PRICE_KEY = 'elasticbot_last_market_price'

interface StoredPrice {
  price: number
  timestamp: number
}

function getStoredPrice(): StoredPrice | null {
  try {
    const stored = localStorage.getItem(LAST_PRICE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Ignore parse errors
  }
  return null
}

function setStoredPrice(price: number): void {
  try {
    localStorage.setItem(LAST_PRICE_KEY, JSON.stringify({
      price,
      timestamp: Date.now(),
    }))
  } catch {
    // Ignore storage errors
  }
}

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
  
  // State for previous price (from localStorage)
  const [previousPrice, setPreviousPrice] = useState<number | null>(null)

  // Load previous price from localStorage on mount
  useEffect(() => {
    const stored = getStoredPrice()
    if (stored) {
      setPreviousPrice(stored.price)
    }
  }, [])

  // Update localStorage when we get a new snapshot
  useEffect(() => {
    if (snapshot) {
      // Only update stored price if it's different (new data)
      const stored = getStoredPrice()
      if (!stored || stored.price !== snapshot.averageSellPrice) {
        // Save current as "previous" for next comparison
        if (stored) {
          setPreviousPrice(stored.price)
        }
        setStoredPrice(snapshot.averageSellPrice)
      }
    }
  }, [snapshot?.averageSellPrice])

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

  // Memoized price change calculation
  const priceChange = useMemo(() => {
    if (!snapshot || previousPrice === null || previousPrice === 0) return null
    if (previousPrice === snapshot.averageSellPrice) return null // No change
    return ((snapshot.averageSellPrice - previousPrice) / previousPrice) * 100
  }, [snapshot?.averageSellPrice, previousPrice])

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
            {priceChange !== null ? (
              <Badge
                variant={priceChange >= 0 ? 'success' : 'destructive'}
                className="flex items-center gap-1 text-sm px-3 py-1"
              >
                {priceChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 text-sm px-3 py-1">
                <Minus className="h-4 w-4" />
                
              </Badge>
            )}
            <span className="text-xs text-muted-foreground mt-1">
              {priceChange !== null ? 'vs. última lectura' : 'Sin cambios'}
            </span>
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Calidad de Datos</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
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
