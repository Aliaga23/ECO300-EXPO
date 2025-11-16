import { useEffect, useState } from 'react'
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from 'recharts'

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function CandlestickChart() {
  const [data, setData] = useState<CandlestickData[]>([])

  useEffect(() => {
    const generateCandlestickData = () => {
      const basePrice = 6.85
      const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
      
      return times.map((time) => {
        const open = basePrice + (Math.random() - 0.5) * 0.3
        const close = open + (Math.random() - 0.5) * 0.2
        const high = Math.max(open, close) + Math.random() * 0.1
        const low = Math.min(open, close) - Math.random() * 0.1
        const volume = Math.floor(Math.random() * 1000) + 500
        
        return {
          time,
          open: Number(open.toFixed(3)),
          high: Number(high.toFixed(3)),
          low: Number(low.toFixed(3)),
          close: Number(close.toFixed(3)),
          volume
        }
      })
    }

    setData(generateCandlestickData())
    const interval = setInterval(() => {
      setData(generateCandlestickData())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props
    if (!payload) return null

    const { open, high, low, close } = payload
    const isGreen = close > open
    const color = isGreen ? '#10b981' : '#ef4444'
    
    const bodyHeight = Math.abs((close - open) / (high - low)) * height
    const bodyY = y + ((Math.max(close, open) - high) / (high - low)) * height
    
    const wickX = x + width / 2
    const highY = y
    const lowY = y + height

    return (
      <g>
        
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={bodyY}
          stroke={color}
          strokeWidth="1"
        />
        
        <rect
          x={x + width * 0.25}
          y={bodyY}
          width={width * 0.5}
          height={bodyHeight}
          fill={color}
          stroke={color}
          strokeWidth="1"
        />
        
        <line
          x1={wickX}
          y1={bodyY + bodyHeight}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth="1"
        />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Apertura:</span>
              <span className="text-foreground font-medium">Bs {data.open}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Máximo:</span>
              <span className="text-green-400 font-medium">Bs {data.high}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mínimo:</span>
              <span className="text-red-400 font-medium">Bs {data.low}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Cierre:</span>
              <span className={`font-medium ${data.close > data.open ? 'text-green-400' : 'text-red-400'}`}>
                Bs {data.close}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volumen:</span>
              <span className="text-foreground font-medium">{data.volume}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">USDT/BOB - Velas Trading</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">En Vivo</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
          />
          <YAxis 
            domain={['dataMin - 0.05', 'dataMax + 0.05']}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="high"
            shape={<CustomCandlestick />}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
            <span className="text-muted-foreground">Alcista</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 bg-red-500 rounded-sm"></div>
            <span className="text-muted-foreground">Bajista</span>
          </div>
        </div>
        <span className="text-muted-foreground">Actualización cada 5s</span>
      </div>
    </div>
  )
}