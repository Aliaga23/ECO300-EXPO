import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useBCBRate, useMarketData } from '@/hooks'
import { Landmark, Info, TrendingUp, AlertTriangle } from 'lucide-react'

export function BCBRateCard() {
  const { indicator, officialRate, loading: bcbLoading, error: bcbError } = useBCBRate()
  const { snapshot, loading: marketLoading } = useMarketData()

  const loading = bcbLoading || marketLoading

  if (loading) {
    return <BCBRateSkeleton />
  }

  if (bcbError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{bcbError}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate premium
  const p2pRate = snapshot?.averageSellPrice || 0
  const premium = officialRate > 0 ? ((p2pRate - officialRate) / officialRate) * 100 : 0

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Tipo de Cambio Oficial BCB</CardTitle>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contexto del Mercado Cambiario Boliviano</DialogTitle>
                <DialogDescription className="text-left pt-4 space-y-3">
                  <p>
                    <strong>Resolución BCB 144/2020:</strong> Limita el acceso a dólares estadounidenses 
                    en el sistema bancario formal boliviano, estableciendo restricciones para la compra 
                    de divisas.
                  </p>
                  <p>
                    <strong>USDT como sustituto:</strong> En este contexto, Tether (USDT) se ha convertido 
                    en un mecanismo alternativo para acceder a valor dolarizado, operando principalmente 
                    a través de mercados P2P como Binance.
                  </p>
                  <p>
                    <strong>Prima de mercado:</strong> La diferencia entre el precio P2P y el tipo de 
                    cambio oficial refleja la escasez de dólares y la demanda del mercado informal. 
                    Esta prima es un indicador clave de las restricciones cambiarias.
                  </p>
                  <p className="text-xs text-muted-foreground pt-2">
                    Fuente: Banco Central de Bolivia (BCB) - {indicator?.source || 'N/A'}
                  </p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Official Rate Display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tipo de Cambio Oficial</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {officialRate.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">BOB/USD</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatDate(indicator?.date)}
          </Badge>
        </div>

        {/* P2P Comparison */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Precio P2P (USDT/BOB)</span>
            <span className="font-semibold">{p2pRate.toFixed(2)} BOB</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Prima de Mercado</span>
            <Badge 
              variant={premium > 30 ? 'destructive' : premium > 15 ? 'warning' : 'info'}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              +{premium.toFixed(2)}%
            </Badge>
          </div>

          {premium > 30 && (
            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Prima elevada indica alta demanda de divisas en el mercado informal 
                debido a restricciones cambiarias.
              </p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        {indicator?.raw_data && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Compra BCB:</span>
                <span className="ml-2 font-medium">{indicator.raw_data.compra} BOB</span>
              </div>
              <div>
                <span className="text-muted-foreground">Venta BCB:</span>
                <span className="ml-2 font-medium">{indicator.raw_data.venta} BOB</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Actualización diaria a las 8:00 AM (hora Bolivia)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BCBRateSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
