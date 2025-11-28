import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Zap, Activity } from "lucide-react"
import { TradingChart } from "./TradingChart"
import { Link } from "react-router-dom"
import { useMarketData } from "@/hooks"

export function Hero() {
  const { snapshot, loading } = useMarketData(60000) // Refresh every 60s on landing

  // Calculate premium over official rate (assuming 6.96 BOB)
  const officialRate = 6.96
  const currentPrice = snapshot?.averageSellPrice ?? 0
  const premium = currentPrice > 0 ? ((currentPrice - officialRate) / officialRate * 100).toFixed(1) : '0'

  return (
    <section className="relative pt-24 pb-4 md:pt-32 md:pb-6 lg:pt-40 lg:pb-8 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-size-[40px_40px]" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 bg-linear-to-b from-accent/5 via-transparent to-transparent" />

      <div className="absolute top-10 md:top-20 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-accent/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
      <div
        className="absolute bottom-10 md:bottom-20 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="w-full relative">
        <div className="w-full max-w-screen-2xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
            <div className="space-y-6 md:space-y-8 pt-8 lg:pt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-card border border-primary/30 shadow-lg shadow-primary/10">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-foreground">
                Análisis de Criptomonedas
              </span>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-balance leading-[1.1] text-foreground">
                Elasticidad de Demanda USDT/BOB
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                Análisis en tiempo real de la demanda de Tether frente al Boliviano con IA y visualización interactiva
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-sm md:text-base font-semibold shadow-lg shadow-primary/20 border border-primary/50 h-11 md:h-12"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Entrar al Dashboard
                </Button>
              </Link>
              <Link to="/dashboard/documentacion">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm md:text-base font-semibold bg-card border-border hover:bg-muted hover:border-primary/50 h-11 md:h-12 text-foreground"
                >
                  Ver Documentación
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 lg:gap-8 pt-2 md:pt-4">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {currentPrice > 0 ? `${currentPrice.toFixed(2)} BOB` : '—'}
                  </div>
                )}
                <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Precio USDT/BOB
                </div>
              </div>
              <div className="w-px h-10 md:h-12 bg-border" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <div className="text-2xl md:text-3xl font-bold text-chart-1">
                    +{premium}%
                  </div>
                )}
                <div className="text-xs md:text-sm text-muted-foreground">Prima vs BCB</div>
              </div>
              <div className="w-px h-10 md:h-12 bg-border" />
              <div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">24/7</div>
                <div className="text-xs md:text-sm text-muted-foreground">Datos en Tiempo Real</div>
              </div>
            </div>
          </div>

          <div className="relative mt-16 lg:mt-8 pt-8 lg:pt-12">
            <div className="relative aspect-square rounded-lg p-4 md:p-6">
              
              <div className="mb-4">
                <TradingChart />
              </div>

              
              <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-card/90 backdrop-blur-md border border-border rounded-lg p-3 md:p-4 shadow-lg">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-chart-1/10 flex items-center justify-center border border-chart-1/30">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-chart-1" />
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">Elasticidad</div>
                    <div className="text-base md:text-lg font-bold text-chart-1">-0.82</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}
