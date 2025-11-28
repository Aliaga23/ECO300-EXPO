import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { MathFormula } from '@/components/ui/math-formula'
import { useSimulator } from '@/hooks'
import type { ScenarioRequest, ScenarioResponse, ParsedElasticityCalculation } from '@/types/api'
import {
  Calculator,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Info,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScenarioSimulatorProps {
  lastCalculation?: ParsedElasticityCalculation | null
}

export function ScenarioSimulator({ lastCalculation }: ScenarioSimulatorProps) {
  const { result, loading, error, validationErrors, calculate, reset } = useSimulator()
  
  // Default example values
  const [priceInitial, setPriceInitial] = useState('7.00')
  const [priceFinal, setPriceFinal] = useState('7.20')
  const [quantityInitial, setQuantityInitial] = useState('125000')
  const [quantityFinal, setQuantityFinal] = useState('118000')
  const [showComparison, setShowComparison] = useState(false)

  const handleCalculate = async () => {
    const request: ScenarioRequest = {
      price_initial: priceInitial,
      price_final: priceFinal,
      quantity_initial: quantityInitial,
      quantity_final: quantityFinal,
    }
    await calculate(request)
  }

  const handleReset = () => {
    setPriceInitial('7.00')
    setPriceFinal('7.20')
    setQuantityInitial('125000')
    setQuantityFinal('118000')
    reset()
    setShowComparison(false)
  }

  const formatNumber = (_value: string, setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9.]/g, '')
    setter(v)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Simulador de Escenarios</CardTitle>
          </div>
          <CardDescription>
            Ingrese valores hipotéticos para calcular la elasticidad de demanda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Inputs */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">P</span>
              Precio USDT/BOB
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceInitial">Precio Inicial</Label>
                <div className="relative">
                  <Input
                    id="priceInitial"
                    type="text"
                    value={priceInitial}
                    onChange={formatNumber(priceInitial, setPriceInitial)}
                    placeholder="7.00"
                    className={cn(validationErrors.price_initial && 'border-destructive')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">BOB</span>
                </div>
                {validationErrors.price_initial && (
                  <p className="text-xs text-destructive">{validationErrors.price_initial}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceFinal">Precio Final</Label>
                <div className="relative">
                  <Input
                    id="priceFinal"
                    type="text"
                    value={priceFinal}
                    onChange={formatNumber(priceFinal, setPriceFinal)}
                    placeholder="7.20"
                    className={cn(validationErrors.price_final && 'border-destructive')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">BOB</span>
                </div>
                {validationErrors.price_final && (
                  <p className="text-xs text-destructive">{validationErrors.price_final}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Inputs */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs">Q</span>
              Cantidad Demandada
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantityInitial">Cantidad Inicial</Label>
                <div className="relative">
                  <Input
                    id="quantityInitial"
                    type="text"
                    value={quantityInitial}
                    onChange={formatNumber(quantityInitial, setQuantityInitial)}
                    placeholder="125000"
                    className={cn(validationErrors.quantity_initial && 'border-destructive')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USDT</span>
                </div>
                {validationErrors.quantity_initial && (
                  <p className="text-xs text-destructive">{validationErrors.quantity_initial}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityFinal">Cantidad Final</Label>
                <div className="relative">
                  <Input
                    id="quantityFinal"
                    type="text"
                    value={quantityFinal}
                    onChange={formatNumber(quantityFinal, setQuantityFinal)}
                    placeholder="118000"
                    className={cn(validationErrors.quantity_final && 'border-destructive')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USDT</span>
                </div>
                {validationErrors.quantity_final && (
                  <p className="text-xs text-destructive">{validationErrors.quantity_final}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Calculando...' : 'Calcular Elasticidad'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Help Text */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                La elasticidad se calcula usando la fórmula del punto medio:
              </p>
            </div>
            <div className="pl-6">
              <MathFormula 
                latex="E_d = \frac{\Delta Q / \bar{Q}}{\Delta P / \bar{P}}" 
                displayMode={false}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                donde Q̄ y P̄ son los promedios de las cantidades y precios.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados de Simulación</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <SimulatorResults 
              result={result} 
              lastCalculation={lastCalculation}
              showComparison={showComparison}
              onToggleComparison={() => setShowComparison(!showComparison)}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Ingrese valores y calcule para ver los resultados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SimulatorResultsProps {
  result: ScenarioResponse
  lastCalculation?: ParsedElasticityCalculation | null
  showComparison: boolean
  onToggleComparison: () => void
}

function SimulatorResults({ result, lastCalculation, showComparison, onToggleComparison }: SimulatorResultsProps) {
  const classConfig = result.classification === 'elastic' 
    ? { label: 'ELÁSTICA', variant: 'elastic' as const, icon: TrendingUp, color: 'text-blue-500' }
    : result.classification === 'inelastic'
    ? { label: 'INELÁSTICA', variant: 'inelastic' as const, icon: TrendingDown, color: 'text-red-500' }
    : { label: 'UNITARIA', variant: 'unitary' as const, icon: Minus, color: 'text-yellow-500' }

  const ClassIcon = classConfig.icon

  return (
    <div className="space-y-6">
      {/* Main Result */}
      <div className="text-center p-6 rounded-xl bg-muted/50 border">
        <p className="text-sm text-muted-foreground mb-2">Coeficiente de Elasticidad</p>
        <div className={cn('text-4xl font-bold mb-2', classConfig.color)}>
          {result.elasticity.toFixed(4)}
        </div>
        <Badge variant={classConfig.variant} className="text-sm">
          <ClassIcon className="h-4 w-4 mr-1" />
          Demanda {classConfig.label}
        </Badge>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Desglose del Cálculo</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-muted-foreground">Cambio en Precio</p>
            <p className="text-lg font-semibold text-green-500">
              {result.percentage_change_price >= 0 ? '+' : ''}{result.percentage_change_price.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              ({result.price_change >= 0 ? '+' : ''}{result.price_change.toFixed(2)} BOB)
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-muted-foreground">Cambio en Cantidad</p>
            <p className="text-lg font-semibold text-purple-500">
              {result.percentage_change_quantity >= 0 ? '+' : ''}{result.percentage_change_quantity.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              ({result.quantity_change >= 0 ? '+' : ''}{result.quantity_change.toFixed(0)} USDT)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <span>Ed = {result.percentage_change_quantity.toFixed(2)}%</span>
          <span>/</span>
          <span>{result.percentage_change_price.toFixed(2)}%</span>
          <ArrowRight className="h-4 w-4" />
          <span className="font-semibold text-foreground">{result.elasticity.toFixed(4)}</span>
        </div>
      </div>

      <Separator />

      {/* Comparison with Real Data */}
      {lastCalculation && lastCalculation.elasticityCoefficient !== null && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleComparison}
            className="w-full mb-3"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {showComparison ? 'Ocultar' : 'Comparar con'} Datos Reales
          </Button>

          {showComparison && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                Comparación con Último Cálculo Real
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Tu Hipótesis</p>
                  <p className="text-xl font-bold">{result.elasticity.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mercado Real</p>
                  <p className="text-xl font-bold">{lastCalculation.elasticityCoefficient.toFixed(4)}</p>
                </div>
              </div>

              <div className="text-center">
                <Badge variant={
                  Math.abs(result.elasticity - lastCalculation.elasticityCoefficient) < 0.2 
                    ? 'success' 
                    : 'warning'
                }>
                  Diferencia: {(result.elasticity - lastCalculation.elasticityCoefficient).toFixed(4)}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {Math.abs(result.elasticity) < Math.abs(lastCalculation.elasticityCoefficient)
                  ? 'Tu escenario muestra demanda menos elástica que los datos reales'
                  : 'Tu escenario muestra demanda más elástica que los datos reales'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
