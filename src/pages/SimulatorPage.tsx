import { DashboardLayout } from '@/components/layout'
import { ScenarioSimulator } from '@/components/simulator'
import { useCalculationHistory } from '@/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, Info } from 'lucide-react'

export default function SimulatorPage() {
  const { history } = useCalculationHistory()
  
  // Get the most recent completed calculation for comparison
  const lastCalculation = history.find((calc) => 
    calc.status === 'COMPLETED' && calc.elasticity_coefficient
  )

  // Convert to ParsedElasticityCalculation format if exists
  const parsedLastCalculation = lastCalculation ? {
    id: lastCalculation.id,
    status: lastCalculation.status,
    method: lastCalculation.method,
    startDate: new Date(),
    endDate: new Date(),
    windowSize: 'daily' as const,
    elasticityCoefficient: parseFloat(lastCalculation.elasticity_coefficient!),
    elasticityMagnitude: Math.abs(parseFloat(lastCalculation.elasticity_coefficient!)),
    classification: lastCalculation.classification,
    confidenceInterval: null,
    rSquared: null,
    standardError: null,
    dataPointsUsed: null,
    averageDataQuality: null,
    isSignificant: null,
    errorMessage: null,
    createdAt: new Date(lastCalculation.created_at),
    completedAt: null,
    calculationMetadata: lastCalculation.calculation_metadata || {
      source: 'Unknown',
      currency_pair: 'USDT/BOB',
    },
  } : null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Simulador de Escenarios</h1>
          </div>
          <p className="text-muted-foreground">
            Pruebe escenarios hipotéticos y compare con datos reales del mercado
          </p>
        </div>

        {/* Info Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">
                  El simulador le permite calcular la elasticidad de demanda para valores hipotéticos. 
                  Ingrese precios y cantidades para ver cómo cambiaría la sensibilidad de la demanda 
                  bajo diferentes escenarios.
                </p>
                {lastCalculation && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Último cálculo real:</span>
                    <Badge variant="outline" className="text-xs">
                      Ed = {parseFloat(lastCalculation.elasticity_coefficient!).toFixed(4)}
                    </Badge>
                    <Badge
                      variant={
                        lastCalculation.classification === 'ELASTIC' ? 'elastic' :
                        lastCalculation.classification === 'INELASTIC' ? 'inelastic' : 'unitary'
                      }
                      className="text-xs"
                    >
                      {lastCalculation.classification}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulator Component */}
        <ScenarioSimulator lastCalculation={parsedLastCalculation} />

        {/* Educational Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Demanda Elástica</h3>
              <p className="text-sm text-muted-foreground">
                Cuando |Ed| &gt; 1, los consumidores son muy sensibles al precio. 
                Un pequeño aumento en el precio causa una gran reducción en la cantidad demandada.
              </p>
              <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                <p className="text-xs">
                  <strong>Ejemplo:</strong> Si el precio sube 10% y la cantidad cae 20%, 
                  entonces Ed = -2.0 (elástica)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Demanda Inelástica</h3>
              <p className="text-sm text-muted-foreground">
                Cuando |Ed| &lt; 1, los consumidores son poco sensibles al precio. 
                Esto ocurre típicamente con bienes necesarios o sin sustitutos cercanos.
              </p>
              <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                <p className="text-xs">
                  <strong>Ejemplo:</strong> Si el precio sube 10% y la cantidad cae 5%, 
                  entonces Ed = -0.5 (inelástica)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Hipótesis USDT</h3>
              <p className="text-sm text-muted-foreground">
                Dado el contexto de restricciones cambiarias en Bolivia, se espera que 
                USDT exhiba demanda inelástica como bien de preservación de valor.
              </p>
              <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-xs">
                  <strong>Pruebe:</strong> ¿Qué elasticidad obtiene con diferentes 
                  escenarios de precio y demanda?
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
