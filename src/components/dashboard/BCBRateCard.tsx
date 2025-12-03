import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useMarketData } from '@/hooks'
import { useBCBRateContext, calculatePremium, formatRateType } from '@/contexts/BCBRateContext'
import { BCBRateTypeSelectorCompact, BCBRateTypeSelectorMobile } from './BCBRateTypeSelector'
import { Landmark, Info, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

// Fixed card height constant - ensures consistency across all states
const CARD_HEIGHT = 'h-[420px]'

export function BCBRateCard() {
  const { 
    selectedRateType, 
    currentRate, 
    loading: bcbLoading, 
    error: bcbError 
  } = useBCBRateContext()
  
  const { snapshot, loading: marketLoading } = useMarketData()

  const loading = bcbLoading || marketLoading

  if (loading) {
    return <BCBRateSkeleton />
  }

  if (bcbError) {
    return (
      <Card className={`${CARD_HEIGHT} flex flex-col`}>
        <CardHeader className="pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Tipo de Cambio BCB</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{bcbError.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use backend-computed premium as fallback, but calculate with selected rate
  const p2pRate = snapshot?.averageSellPrice || 0
  const bcbRateStale = snapshot?.bcbRateStale ?? false
  
  // Calculate premium using selected BCB rate
  let premiumMetrics = null
  if (currentRate && p2pRate > 0) {
    premiumMetrics = calculatePremium(p2pRate, currentRate, selectedRateType)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Calculate spread values
  const buyRate = currentRate ? parseFloat(currentRate.buy) : 0
  const sellRate = currentRate ? parseFloat(currentRate.sell) : 0
  const spreadAbsolute = sellRate - buyRate
  const spreadPercentage = buyRate > 0 ? ((spreadAbsolute / buyRate) * 100) : 0

  return (
    <Card className={`${CARD_HEIGHT} flex flex-col`}>
      {/* Header - Fixed height h-12 (48px) to match MarketDataCard */}
      <CardHeader className="h-12 flex items-center shrink-0 py-0 px-4">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 min-w-0">
            <Landmark className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-lg font-semibold">Tipo de Cambio BCB</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile-only compact selector */}
            <div className="block sm:hidden">
              <BCBRateTypeSelectorMobile />
            </div>
            {/* Desktop selector */}
            <div className="hidden sm:block">
              <BCBRateTypeSelectorCompact />
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
                      cambio seleccionado refleja la escasez de dólares y la demanda del mercado informal. 
                      Esta prima es un indicador clave de las restricciones cambiarias.
                    </p>
                    <p>
                      <strong>Tipos de cambio BCB:</strong> El BCB ahora publica dos tasas:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Oficial:</strong> Para operaciones en el sistema financiero formal</li>
                      <li><strong>Referencial:</strong> Valor de referencia que refleja condiciones de mercado más amplias</li>
                    </ul>
                    <p className="text-xs text-muted-foreground pt-2">
                      Fuente: Banco Central de Bolivia (BCB)
                    </p>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {/* Content - Optimized heights to fit in 420px card */}
      <CardContent className="flex-1 grid grid-rows-1 px-4 pb-3 pt-1">
        <div className="place-self-center w-full">
          {/* Main Rate Display - Fixed height 60px (matches MarketDataCard) */}
          <div className="h-[60px] flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Tipo {formatRateType(selectedRateType)}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {currentRate ? parseFloat(currentRate.sell).toFixed(2) : '—'}
              </span>
              <span className="text-sm text-muted-foreground">BOB/USD</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs">
              {formatDate(snapshot?.bcbRateDate)}
            </Badge>
            {bcbRateStale && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-warning flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Desactualizado
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Los datos del BCB pueden no estar actualizados</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Buy/Sell/Spread - Fixed height 90px (matches MarketDataCard) */}
        <div className="h-[90px] bg-muted/30 rounded-lg p-3 flex flex-col justify-center shrink-0 mt-1">
          <div className="flex items-center justify-between text-sm h-7">
            <span className="text-muted-foreground text-left">Compra</span>
            <span className="font-semibold text-green-600 dark:text-green-500 text-right">
              {currentRate ? parseFloat(currentRate.buy).toFixed(2) : '—'} BOB
            </span>
          </div>
          <div className="flex items-center justify-between text-sm h-7">
            <span className="text-muted-foreground text-left">Venta</span>
            <span className="font-semibold text-red-600 dark:text-red-500 text-right">
              {currentRate ? parseFloat(currentRate.sell).toFixed(2) : '—'} BOB
            </span>
          </div>
          <div className="flex items-center justify-between text-sm h-7 pt-1 border-t border-border/50">
            <span className="text-muted-foreground text-left">Spread</span>
            <span className="font-medium text-muted-foreground text-right">
              {spreadAbsolute.toFixed(2)} BOB ({spreadPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Prima de Mercado - Fixed height 48px (matches Volume/Traders row) */}
        <div className="h-[48px] bg-muted/20 rounded-lg flex items-center px-3 shrink-0 mt-1">
          <div className="flex items-center justify-between text-sm w-full">
            <span className="text-muted-foreground text-left">Prima de Mercado</span>
            {premiumMetrics ? (
              <div className="flex items-center gap-1.5">
                {premiumMetrics.is_above_bcb ? (
                  <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                )}
                <span className={`font-semibold ${
                  premiumMetrics.is_above_bcb ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'
                }`}>
                  {premiumMetrics.is_above_bcb ? '+' : ''}{premiumMetrics.premium_absolute.toFixed(2)} BOB ({premiumMetrics.is_above_bcb ? '+' : ''}{premiumMetrics.premium_percentage.toFixed(2)}%)
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground font-medium">N/D</span>
            )}
          </div>
        </div>

        {/* Empty row placeholder - Fixed height 40px (matches Previous Price row) */}
        <div className="h-[40px] shrink-0 mt-1" />

        {/* Footer - Fixed height 32px (matches MarketDataCard) */}
          <div className="h-8 flex items-center justify-center border-t border-border shrink-0">
            <p className="text-xs text-muted-foreground">
              BCB actualiza a las 8:00 AM (hora Bolivia)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BCBRateSkeleton() {
  return (
    <Card className={`${CARD_HEIGHT} flex flex-col`}>
      {/* Header - Fixed height h-12 */}
      <CardHeader className="h-12 flex items-center shrink-0 py-0 px-4">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-44 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardHeader>

      {/* Content - Optimized heights */}
      <CardContent className="flex-1 grid grid-rows-1 px-4 pb-3 pt-1">
        <div className="place-self-center w-full">
          {/* Main rate - h-[60px] */}
          <div className="h-[60px] flex items-center justify-between shrink-0">
          <div>
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-5 w-24 rounded" />
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
            <Skeleton className="h-4 w-28 text-right" />
          </div>
        </div>

        {/* Prima - h-[48px] */}
        <div className="h-[48px] bg-muted/20 rounded-lg flex items-center px-3 shrink-0 mt-1">
          <div className="flex justify-between w-full">
            <Skeleton className="h-4 w-28 text-left" />
            <Skeleton className="h-4 w-36 text-right" />
          </div>
        </div>

        {/* Empty placeholder - h-[40px] */}
        <div className="h-[40px] shrink-0 mt-1" />

        {/* Footer - h-8 */}
          <div className="h-8 flex items-center justify-center border-t border-border shrink-0">
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
