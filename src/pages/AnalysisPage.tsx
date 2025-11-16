import { useState, useEffect, useRef } from 'react'
import { Card } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Header } from '../components/Header'
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, BarChart3 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { binanceP2PService, type MarketData } from '../services/binanceP2P'
const OFFICIAL_USD_BOB_RATE = 6.96
const MetricSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  </Card>
)

const ChartSkeleton = () => (
  <div className="h-80 flex flex-col space-y-4">
    <div className="flex justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex-1 flex items-end space-x-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
    <div className="flex justify-between">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
)

const TraderSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
)

export default function AnalysisPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [historicalData, setHistoricalData] = useState<Array<{
    timestamp: Date
    price: number
    volume: number
    elasticity: number
    buyPrice: number
    sellPrice: number
  }>>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [zoomDomain, setZoomDomain] = useState<{ startIndex: number; endIndex: number } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [market, historical] = await Promise.all([
          binanceP2PService.getMarketData('SELL'),
          binanceP2PService.getHistoricalData(30)
        ])
        
        setMarketData(market)
        setHistoricalData(historical)
        setLastUpdate(new Date())
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
       
      }
    }

    fetchData()
    
   
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

 
  const calculateElasticity = (currentPrice: number) => {
    const priceVariation = ((currentPrice - OFFICIAL_USD_BOB_RATE) / OFFICIAL_USD_BOB_RATE) * 100
   
    return -1.2 - (priceVariation * 0.1)
  }

 
  const elasticityChartData = historicalData.map((item, index) => {
    const elasticity = calculateElasticity(item.sellPrice)
   
    return {
      timestamp: item.timestamp.getTime(),
      date: item.timestamp.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      fullDate: item.timestamp,
      elasticity: Number(elasticity.toFixed(3)),
      buyPrice: Number(item.buyPrice.toFixed(2)),
      sellPrice: Number(item.sellPrice.toFixed(2)),
      officialRate: OFFICIAL_USD_BOB_RATE,
      volume: Math.round(item.volume),
      index
    }
  })

 
  const displayedChartData = zoomDomain 
    ? elasticityChartData.slice(zoomDomain.startIndex, zoomDomain.endIndex + 1)
    : elasticityChartData

 
  const getDateFormat = () => {
    if (!zoomDomain) return 'default'
    const range = zoomDomain.endIndex - zoomDomain.startIndex + 1
    const totalDays = elasticityChartData.length
    
   
    const daysShown = (range / totalDays) * 30
    
    if (daysShown <= 0.5) return 'hour'
    if (daysShown <= 2) return 'hour-simple'
    if (daysShown <= 7) return 'day'
    if (daysShown <= 15) return 'week'
    return 'default'
  }

  const formatChartDate = (item: typeof elasticityChartData[0]) => {
    const format = getDateFormat()
    switch(format) {
      case 'hour':
        return item.fullDate.toLocaleString('es-ES', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      case 'hour-simple':
        return item.fullDate.toLocaleString('es-ES', { 
          day: '2-digit',
          hour: '2-digit'
        })
      case 'day':
        return item.fullDate.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          day: '2-digit', 
          month: 'short' 
        })
      case 'week':
        return item.fullDate.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        })
      default:
        return item.date
    }
  }

  const chartDataWithFormattedDates = displayedChartData.map(item => ({
    ...item,
    displayDate: formatChartDate(item)
  }))

 
  useEffect(() => {
    const chartElement = chartRef.current
    if (!chartElement) return

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (elasticityChartData.length === 0) return
      
     
      const isZoomingIn = e.deltaY > 0
      
      if (!zoomDomain) {
        if (isZoomingIn) {
         
          const dataLength = elasticityChartData.length
          const initialRange = Math.floor(dataLength * 0.5)
          setZoomDomain({
            startIndex: dataLength - initialRange,
            endIndex: dataLength - 1
          })
        }
      } else {
        const currentRange = zoomDomain.endIndex - zoomDomain.startIndex + 1
        
        if (isZoomingIn) {
         
         
          const minRange = Math.max(3, Math.floor(elasticityChartData.length * 0.1))
          const newRange = Math.max(minRange, Math.floor(currentRange * 0.85))
          
          if (newRange >= currentRange) {
           
            return
          }
          
          const newStart = zoomDomain.endIndex - newRange + 1
          
          setZoomDomain({ 
            startIndex: Math.max(0, newStart), 
            endIndex: zoomDomain.endIndex 
          })
        } else {
         
          const newRange = Math.min(elasticityChartData.length, Math.floor(currentRange * 1.15))
          
          if (newRange >= elasticityChartData.length) {
           
            setZoomDomain(null)
            return
          }
          
          const newStart = zoomDomain.endIndex - newRange + 1
          
          setZoomDomain({ 
            startIndex: Math.max(0, newStart), 
            endIndex: zoomDomain.endIndex 
          })
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!zoomDomain || elasticityChartData.length === 0) return
      
      const currentRange = zoomDomain.endIndex - zoomDomain.startIndex + 1
      const step = Math.max(1, Math.floor(currentRange * 0.1))
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
       
        e.preventDefault()
        const newStart = Math.max(0, zoomDomain.startIndex - step)
        const newEnd = Math.max(currentRange - 1, zoomDomain.endIndex - step)
        
        if (newStart >= 0) {
          setZoomDomain({ startIndex: newStart, endIndex: newEnd })
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
       
        e.preventDefault()
        const newEnd = Math.min(elasticityChartData.length - 1, zoomDomain.endIndex + step)
        const newStart = Math.min(elasticityChartData.length - currentRange, zoomDomain.startIndex + step)
        
        if (newEnd < elasticityChartData.length) {
          setZoomDomain({ startIndex: newStart, endIndex: newEnd })
        }
      }
    }

    chartElement.addEventListener('wheel', handleWheelEvent, { passive: false })
    chartElement.addEventListener('keydown', handleKeyDown)
    chartElement.setAttribute('tabindex', '0')
    
    return () => {
      chartElement.removeEventListener('wheel', handleWheelEvent)
      chartElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [elasticityChartData, zoomDomain])

 
  const currentElasticity = historicalData.length > 0 ? 
    calculateElasticity(historicalData[historicalData.length - 1].sellPrice) : 0
  
  const avgPrice = marketData?.avgPrice || 0
  const totalVolume = Math.round(marketData?.volume || 0)
  const totalOffers = marketData?.totalOffers || 0

  if (loading || !marketData || !historicalData.length) {
    return (
      <div className="min-h-screen w-full">
        <Header />
        <div className="pt-20 px-4 pb-8">
          <div className="w-full max-w-screen-2xl mx-auto">
            
            <div className="mb-8">
              <Skeleton className="h-10 w-96 mb-2" />
              <Skeleton className="h-6 w-80 mb-4" />
              <Skeleton className="h-4 w-64" />
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </div>

            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <ChartSkeleton />
              </Card>
              <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <ChartSkeleton />
              </Card>
            </div>

            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <TraderSkeleton />
              </Card>
              <div className="grid grid-cols-1 gap-6">
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <Header />
      <div className="pt-20 px-4 pb-8">
        <div className="w-full max-w-screen-2xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Análisis de Elasticidad USDT/BOB</h1>
            <p className="text-muted-foreground text-lg">Análisis académico en tiempo real del mercado P2P boliviano</p>
            <div className="mt-4 text-sm text-muted-foreground">
              Datos de {totalOffers} ofertas activas • Última actualización: {lastUpdate?.toLocaleTimeString('es-ES') || 'Cargando...'}
              <span className="ml-4 text-green-600">• Actualización cada 5 minutos</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Precio oficial USD/BOB: {OFFICIAL_USD_BOB_RATE} BOB (base para cálculo de elasticidad)
            </div>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Elasticidad Actual</p>
                  <p className="text-2xl font-bold">{currentElasticity.toFixed(3)}</p>
                  <p className="text-xs text-primary">{Math.abs(currentElasticity) > 1 ? 'Demanda elástica' : 'Demanda inelástica'}</p>
                </div>
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Precio Promedio</p>
                  <p className="text-2xl font-bold">{avgPrice.toFixed(2)} BOB</p>
                  <p className="text-xs text-blue-600">por USDT</p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Volumen Total</p>
                  <p className="text-2xl font-bold">{(totalVolume / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-purple-600">USDT disponibles</p>
                </div>
                <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ofertas Activas</p>
                  <p className="text-2xl font-bold">{totalOffers}</p>
                  <p className="text-xs text-orange-600">Traders P2P</p>
                </div>
                <div className="h-12 w-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </Card>
          </div>

          
          <div className="grid grid-cols-1 gap-8 mb-8">
            
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2">Evolución Histórica: Precio vs Elasticidad</h3>
              <p className="text-sm text-muted-foreground mb-2">Datos reales de los últimos 30 días</p>
              <p className="text-xs text-blue-500 mb-4"> Scroll ↓: acercar (menos días) | Scroll ↑: alejar (más días) | Flechas: navegar</p>
              <div 
                ref={chartRef}
                className="h-96" 
                style={{ overflow: 'hidden' }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataWithFormattedDates}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9CA3AF" 
                      fontSize={11} 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Precio (BOB)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 12 } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Elasticidad', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF', fontSize: 12 } }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                        fontSize: '12px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="buyPrice" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                      name="Precio Compra (BOB)"
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="sellPrice" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                      name="Precio Venta (BOB)"
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="officialRate" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Dólar Oficial (6.96 BOB)"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="elasticity" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                      name="Elasticidad"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <Card className="lg:col-span-2 p-6">
              <h3 className="text-xl font-semibold mb-4">Top Traders P2P</h3>
              <p className="text-sm text-muted-foreground mb-4">Mejores vendedores por volumen y rating</p>
              <div className="space-y-4">
                {marketData?.topTraders.map((trader, index) => (
                  <div key={trader.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{trader.name}</p>
                        <p className="text-sm text-muted-foreground">{trader.rating.toFixed(1)}% rating</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{trader.price.toFixed(2)} BOB</p>
                      <p className="text-sm text-muted-foreground">{trader.volume.toFixed(0)} USDT</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Precio Mínimo</p>
                    <p className="text-xl font-bold text-green-600">{marketData?.minPrice.toFixed(2)} BOB</p>
                    <p className="text-xs text-muted-foreground">Mejor oferta</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Precio Máximo</p>
                    <p className="text-xl font-bold text-red-600">{marketData?.maxPrice.toFixed(2)} BOB</p>
                    <p className="text-xs text-muted-foreground">Mayor precio</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Liquidez Total</p>
                    <p className="text-xl font-bold text-blue-600">{(marketData?.totalLiquidity || 0).toFixed(0)} USDT</p>
                    <p className="text-xs text-muted-foreground">Disponible</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Estadísticas del Mercado</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spread promedio:</span>
                      <span className="font-medium">{((marketData?.maxPrice || 0) - (marketData?.minPrice || 0)).toFixed(3)} BOB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Período análisis:</span>
                      <span className="font-medium">30 días</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Datos históricos:</span>
                      <span className="font-medium">{historicalData.length} puntos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio oficial USD:</span>
                      <span className="font-medium">{OFFICIAL_USD_BOB_RATE} BOB</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}