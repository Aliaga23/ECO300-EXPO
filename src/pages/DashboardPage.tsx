import { DashboardLayout } from '@/components/layout'
import { MarketDataCard, BCBRateCard } from '@/components/dashboard'
import { HistoricalChart } from '@/components/history'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCalculationHistory } from '@/hooks'
import { Link } from 'react-router-dom'
import {
  Calculator,
  TrendingUp,
  History,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Activity,
} from 'lucide-react'

export default function DashboardPage() {
  const { history } = useCalculationHistory()
  const recentCalculations = history.slice(0, 3)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Panel de control para análisis de elasticidad USDT/BOB
          </p>
        </div>

        {/* Market Overview Cards - Cards manage their own height internally */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketDataCard />
          <BCBRateCard />
        </div>

        {/* Historical Chart */}
        <HistoricalChart />

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Comience a analizar la elasticidad del mercado USDT/BOB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <QuickActionCard
                  icon={Calculator}
                  title="Nuevo Análisis"
                  description="Calcular elasticidad con datos reales"
                  href="/dashboard/analisis"
                  variant="primary"
                />
                <QuickActionCard
                  icon={TrendingUp}
                  title="Simulador"
                  description="Probar escenarios hipotéticos"
                  href="/dashboard/simulador"
                  variant="secondary"
                />
                <QuickActionCard
                  icon={BookOpen}
                  title="Documentación"
                  description="Metodología y guías de uso"
                  href="/dashboard/documentacion"
                  variant="outline"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Calculations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4 text-primary" />
                  Cálculos Recientes
                </CardTitle>
                <Link to="/dashboard/historial">
                  <Button variant="ghost" size="sm">
                    Ver todo
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentCalculations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin cálculos recientes</p>
                  <Link to="/dashboard/analisis">
                    <Button variant="link" size="sm" className="mt-2">
                      Realizar primer análisis
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {calc.method}
                          </Badge>
                          {calc.classification && (
                            <Badge
                              variant={
                                calc.classification === 'ELASTIC' ? 'elastic' :
                                calc.classification === 'INELASTIC' ? 'inelastic' : 'unitary'
                              }
                              className="text-xs"
                            >
                              {calc.classification}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(calc.created_at).toLocaleDateString('es-BO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className="text-lg font-mono font-bold">
                        {calc.elasticity_coefficient
                          ? parseFloat(calc.elasticity_coefficient).toFixed(3)
                          : '—'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Educational Context */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Contexto Académico</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ElasticBot es una herramienta de investigación econométrica desarrollada para 
                  analizar la elasticidad de demanda de USDT en el mercado boliviano. El sistema 
                  utiliza datos reales de Binance P2P y aplica metodologías de punto medio y 
                  regresión log-log para estimar la sensibilidad de la demanda a cambios de precio, 
                  considerando el contexto de restricciones cambiarias en Bolivia.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">ECO-300</Badge>
                  <Badge variant="secondary">Economía para la Gestión</Badge>
                  <Badge variant="secondary">UAGRM</Badge>
                  <Badge variant="secondary">2025</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

interface QuickActionCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href: string
  variant: 'primary' | 'secondary' | 'outline'
}

function QuickActionCard({ icon: Icon, title, description, href, variant }: QuickActionCardProps) {
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border-2 border-dashed hover:bg-muted',
  }

  return (
    <Link to={href}>
      <div className={`p-4 rounded-lg transition-colors cursor-pointer ${variantStyles[variant]}`}>
        <Icon className="h-8 w-8 mb-3" />
        <h4 className="font-semibold">{title}</h4>
        <p className={`text-sm mt-1 ${variant === 'outline' ? 'text-muted-foreground' : 'opacity-80'}`}>
          {description}
        </p>
      </div>
    </Link>
  )
}
