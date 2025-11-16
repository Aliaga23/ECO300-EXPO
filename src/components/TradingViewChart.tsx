import { useState, useEffect } from 'react'
import { ComposedChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface TradingViewChartProps {
  width?: number
  height?: number
}

export function TradingViewChart({ height = 400 }: TradingViewChartProps) {
  const [isLive, setIsLive] = useState(true)
  
 
  const generateCandlestickData = () => {
    const data = []
    let currentPrice = 6.85
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000)
      
      const open = currentPrice
      const change = (Math.random() - 0.5) * 0.08
      const close = Math.max(6.5, Math.min(7.2, open + change))
      
      const high = Math.max(open, close) + Math.random() * 0.04
      const low = Math.min(open, close) - Math.random() * 0.04
      
      data.push({
        time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        open: Number(open.toFixed(4)),
        high: Number(Math.min(7.2, high).toFixed(4)),
        low: Number(Math.max(6.5, low).toFixed(4)),
        close: Number(close.toFixed(4)),
        timestamp: time.getTime()
      })
      
      currentPrice = close
    }
    
    return data
  }

  const [chartData, setChartData] = useState(generateCandlestickData)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setChartData(prevData => {
        const newData = [...prevData]
        const lastCandle = newData[newData.length - 1]
        const now = new Date()
        
       
        const volatility = 0.02 + Math.random() * 0.04
        const change = (Math.random() - 0.5) * volatility
        const newClose = Math.max(6.5, Math.min(7.2, lastCandle.close + change))
        const newHigh = Math.max(lastCandle.high, lastCandle.open, newClose, newClose + Math.random() * 0.03)
        const newLow = Math.min(lastCandle.low, lastCandle.open, newClose, newClose - Math.random() * 0.03)
        
        newData[newData.length - 1] = {
          ...lastCandle,
          high: Number(newHigh.toFixed(4)),
          low: Number(newLow.toFixed(4)),
          close: Number(newClose.toFixed(4))
        }
        
       
        if (now.getTime() - lastCandle.timestamp > 30000) {
          const volatility = 0.03 + Math.random() * 0.05
          const change = (Math.random() - 0.5) * volatility
          const newPrice = Math.max(6.5, Math.min(7.2, newClose + change))
          
          const newCandle = {
            time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            open: newClose,
            high: newPrice + Math.random() * 0.04,
            low: newPrice - Math.random() * 0.04,
            close: newPrice,
            timestamp: now.getTime()
          }
          
          newData.push(newCandle)
          
         
          if (newData.length > 24) {
            newData.shift()
          }
        }
        
        return newData
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

 
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props
    if (!payload || !payload.open) return null
    
    const { open, close, high, low } = payload
    const isUp = close >= open
    const color = isUp ? '#00D09C' : '#F7931A'
    
   
    const minPrice = 6.5
    const maxPrice = 7.2
    const priceRange = maxPrice - minPrice
    
    const getY = (price: number) => {
      const normalizedPrice = (price - minPrice) / priceRange
      return y + height - (normalizedPrice * height)
    }
    
    const centerX = x + width / 2
    const bodyWidth = Math.max(width * 0.8, 4)
    const bodyX = x + (width - bodyWidth) / 2
    
    const highY = getY(high)
    const lowY = getY(low)
    const openY = getY(open)
    const closeY = getY(close)
    
    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.abs(openY - closeY)
    
    return (
      <g>
        
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={lowY}
          stroke={color}
          strokeWidth={2} 
        />
        
        <rect
          x={bodyX}
          y={bodyTop}
          width={bodyWidth}
          height={Math.max(bodyHeight, 2)} 
          fill={isUp ? color : color}
          stroke={color}
          strokeWidth={1}
          fillOpacity={isUp ? 0.7 : 1}
        />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isUp = data.close >= data.open
      
      return (
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs">
          <p className="text-foreground font-semibold mb-1">{label}</p>
          <p className="text-muted-foreground">O: <span className="text-foreground">{data.open}</span></p>
          <p className="text-muted-foreground">H: <span className="text-foreground">{data.high}</span></p>
          <p className="text-muted-foreground">L: <span className="text-foreground">{data.low}</span></p>
          <p className="text-muted-foreground">C: <span className={isUp ? 'text-green-500' : 'text-red-500'}>{data.close}</span></p>
        </div>
      )
    }
    return null
  }

  const currentPrice = chartData[chartData.length - 1]?.close || 0
  const prevPrice = chartData[chartData.length - 2]?.close || currentPrice
  const priceChange = currentPrice - prevPrice
  const priceChangePercent = ((priceChange / prevPrice) * 100)

  return (
    <div className="relative">
      
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-500'} ${isLive ? 'animate-pulse' : ''}`} />
            <span className="text-muted-foreground">
              {isLive ? 'EN VIVO' : 'PAUSADO'}
            </span>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {isLive ? 'Pausar' : 'Reanudar'}
          </button>
        </div>
      </div>

      
      <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">
            {currentPrice.toFixed(4)} BOB
          </div>
          <div className={`text-sm flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}</span>
            <span>({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      
      <div className="w-full rounded-lg border border-border overflow-hidden" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData} 
            margin={{ top: 50, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8B8D98', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[6.5, 7.2]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8B8D98', fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="open" 
              shape={<CandlestickBar />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
