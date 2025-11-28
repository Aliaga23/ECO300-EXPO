import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarketData } from '@/hooks'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  BarChart3,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MarketDataCard() {
  const { snapshot, previousSnapshot, loading, error, lastUpdated } = useMarketData()

  if (loading) {
    return <MarketDataSkeleton />
  }

  if (error || !snapshot) {
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

  const priceChange = previousSnapshot
    ? ((snapshot.averageSellPrice - previousSnapshot.averageSellPrice) / previousSnapshot.averageSellPrice) * 100
    : 0

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toFixed(0)
  }

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'Actualizando...'
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `Hace ${seconds}s`
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`
    return `Hace ${Math.floor(seconds / 3600)}h`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Datos del Mercado P2P</CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatRelativeTime(lastUpdated)}
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
                {snapshot.averageSellPrice.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">BOB</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
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
            <span className="text-xs text-muted-foreground mt-1">vs. última lectura</span>
          </div>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricItem
            icon={DollarSign}
            label="Precio Compra"
            value={`${snapshot.averageBuyPrice.toFixed(2)} BOB`}
            color="text-green-500"
          />
          <MetricItem
            icon={DollarSign}
            label="Precio Venta"
            value={`${snapshot.averageSellPrice.toFixed(2)} BOB`}
            color="text-red-500"
          />
          <MetricItem
            icon={BarChart3}
            label="Volumen Total"
            value={`${formatVolume(snapshot.totalVolume)} USDT`}
            color="text-purple-500"
          />
          <MetricItem
            icon={Users}
            label="Traders Activos"
            value={snapshot.numActiveTraders.toString()}
            color="text-orange-500"
          />
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
                    snapshot.dataQualityScore >= 0.8 ? 'bg-green-500' :
                    snapshot.dataQualityScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${snapshot.dataQualityScore * 100}%` }}
                />
              </div>
              <Badge
                variant={
                  snapshot.dataQualityScore >= 0.8 ? 'success' :
                  snapshot.dataQualityScore >= 0.5 ? 'warning' : 'destructive'
                }
              >
                {(snapshot.dataQualityScore * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Spread: {snapshot.spreadPercentage.toFixed(2)}% • 
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
