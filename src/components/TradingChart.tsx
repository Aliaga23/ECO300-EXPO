import { useEffect, useState } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line } from 'recharts'

interface DataPoint {
  time: string
  price: number
}

export function TradingChart() {
  const [data, setData] = useState<DataPoint[]>([])

  useEffect(() => {
    const initialData: DataPoint[] = []
    const basePrice = 6.90
    for (let i = 0; i < 30; i++) {
      const variation = Math.sin(i / 3) * 0.15 + (Math.random() - 0.5) * 0.08
      initialData.push({
        time: `${i}`,
        price: basePrice + variation
      })
    }
    setData(initialData)
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData.slice(1)]
        const lastPrice = prevData[prevData.length - 1].price
        const variation = (Math.random() - 0.5) * 0.04
        newData.push({
          time: `${Date.now()}`,
          price: Math.max(6.70, Math.min(7.10, lastPrice + variation))
        })
        return newData
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const currentPrice = data[data.length - 1]?.price || 6.90
  const priceChange = data.length > 1 ? data[data.length - 1].price - data[0].price : 0
  const percentChange = ((priceChange / data[0]?.price) * 100) || 0

  return (
    <div className="w-full h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/20 rounded-xl p-5 shadow-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider">USDT/BOB</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-1 animate-pulse"></div>
            <span className="text-[10px] text-muted-foreground">En Vivo</span>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-bold text-foreground">
            Bs {currentPrice.toFixed(3)}
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${percentChange >= 0 ? 'bg-chart-1/10 text-chart-1' : 'bg-chart-2/10 text-chart-2'}`}>
            {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(2)}%
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Última actualización: hace unos segundos
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.52 0.16 245)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="oklch(0.52 0.16 245)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.04 250)" opacity={0.2} />
          <XAxis 
            dataKey="time" 
            hide 
          />
          <YAxis 
            domain={['dataMin - 0.05', 'dataMax + 0.05']}
            hide
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.16 0.04 250)',
              border: '1px solid oklch(0.52 0.16 245)',
              borderRadius: '12px',
              color: 'oklch(0.98 0 0)',
              padding: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}
            formatter={(value: number) => [`Bs ${value.toFixed(3)}`, 'Precio']}
            labelFormatter={() => 'Tiempo real'}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="oklch(0.52 0.16 245)"
            strokeWidth={3}
            fill="url(#colorPrice)"
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="oklch(0.62 0.24 150)"
            strokeWidth={1}
            dot={false}
            opacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
