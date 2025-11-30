import { useMarketData } from '@/hooks'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DashboardHeader() {
  const { snapshot, loading, lastUpdated, refresh } = useMarketData()

  // Use backend-computed price change - no local calculations
  const priceChange = snapshot?.priceChangePercentage
  const priceDirection = snapshot?.priceChangeDirection
  const showPriceChange = priceChange !== null && !snapshot?.isFirstSnapshot

  const formatTime = (date: Date | null) => {
    if (!date) return 'Actualizando...'
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
  }

  // Get badge variant based on backend direction
  const getPriceChangeBadgeVariant = () => {
    if (!priceDirection || priceDirection === 'neutral') return 'secondary'
    return priceDirection === 'up' ? 'success' : 'destructive'
  }

  // Get icon based on backend direction
  const PriceChangeIcon = priceDirection === 'up' ? TrendingUp 
    : priceDirection === 'down' ? TrendingDown 
    : Minus

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Page Title Area - Left */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Panel de Control
          </h2>
        </div>

        {/* Market Ticker - Right */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          ) : snapshot ? (
            <div className="flex items-center gap-4">
              {/* Current Price */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">USDT/BOB:</span>
                <span className="text-lg font-bold text-foreground">
                  {snapshot.averageSellPrice.toFixed(2)}
                </span>
                
                {/* Price Change Indicator - using backend values directly */}
                {showPriceChange && priceChange !== null && priceChange !== undefined ? (
                  <Badge 
                    variant={getPriceChangeBadgeVariant()}
                    className="flex items-center gap-1"
                  >
                    <PriceChangeIcon className="h-3 w-3" />
                    <span>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Minus className="h-3 w-3" />
                    <span>—</span>
                  </Badge>
                )}
              </div>

              {/* Data Quality */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Calidad:</span>
                <Badge
                  variant={
                    snapshot.dataQualityScore >= 0.8 ? 'success' :
                    snapshot.dataQualityScore >= 0.5 ? 'warning' : 'destructive'
                  }
                >
                  {(snapshot.dataQualityScore * 100).toFixed(0)}%
                </Badge>
              </div>

              {/* Last Update Time */}
              <span className="text-xs text-muted-foreground hidden lg:block">
                Actualizado: {formatTime(lastUpdated)}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Sin datos</span>
          )}

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refresh}
            disabled={loading}
            className={cn(loading && 'animate-spin')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Theme Toggle */}
          <div className="border-l border-border pl-4 ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
