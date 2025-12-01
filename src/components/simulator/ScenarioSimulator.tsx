import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  HelpCircle,
  AlertTriangle,
  Activity,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full sm:flex-1 h-12 sm:h-11"
            >
              {loading ? 'Calculando...' : 'Calcular Elasticidad'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full sm:w-auto h-12 sm:h-11"
            >
              <RotateCcw className="h-4 w-4 mr-2 sm:mr-0" />
              <span className="sm:hidden">Resetear</span>
            </Button>
          </div>

          {/* Help Text with Formula */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                La elasticidad se calcula usando la <strong>fórmula del punto medio</strong>:
              </p>
            </div>
            
            {/* Formula Display */}
            <div className="flex justify-center py-2">
              <div className="bg-background/80 px-6 py-3 rounded-lg border">
                <div className="text-center font-serif text-lg">
                  <span className="italic">E</span><sub>d</sub>
                  <span className="mx-2">=</span>
                  <span className="inline-flex flex-col items-center mx-1 align-middle">
                    <span className="border-b border-current px-2 pb-0.5">
                      ΔQ / Q̄
                    </span>
                    <span className="pt-0.5">
                      ΔP / P̄
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1 pl-6">
              <p><strong>Donde:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>ΔQ = Q₂ - Q₁ (cambio en cantidad)</li>
                <li>ΔP = P₂ - P₁ (cambio en precio)</li>
                <li>Q̄ = (Q₁ + Q₂) / 2 (promedio de cantidades)</li>
                <li>P̄ = (P₁ + P₂) / 2 (promedio de precios)</li>
              </ul>
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
  // Use backend elasticity_category with fallback to classification for backward compatibility
  const effectiveCategory = result.elasticity_category ?? result.classification;
  
  const classConfig = effectiveCategory === 'elastic' 
    ? { label: 'ELÁSTICA', variant: 'elastic' as const, icon: TrendingUp, color: 'text-blue-500' }
    : effectiveCategory === 'inelastic'
    ? { label: 'INELÁSTICA', variant: 'inelastic' as const, icon: TrendingDown, color: 'text-red-500' }
    : effectiveCategory === 'unitary' || effectiveCategory === 'unit_elastic'
    ? { label: 'UNITARIA', variant: 'unitary' as const, icon: Minus, color: 'text-yellow-500' }
    : { label: 'N/A', variant: 'secondary' as const, icon: Activity, color: 'text-muted-foreground' }

  const ClassIcon = classConfig.icon
  
  // Handle hypothetical scenario warning with backward compatibility
  const isHypothetical = result.is_hypothetical ?? false;
  const warningMessage = result.warning_message ?? null;

  return (
    <div className="space-y-6">
      {/* Main Result */}
      <div className="text-center p-6 rounded-xl bg-muted/50 border">
        <p className="text-sm text-muted-foreground mb-2">Coeficiente de Elasticidad</p>
        <div className={cn('text-4xl font-bold mb-2', classConfig.color)}>
          {result.elasticity.toFixed(4)}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={classConfig.variant} className="text-sm cursor-help">
                  <ClassIcon className="h-4 w-4 mr-1" />
                  Demanda {classConfig.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  <strong>Demanda {classConfig.label.toLowerCase()}:</strong> La clasificación se basa en el valor absoluto |Ed|.
                  {effectiveCategory === 'elastic' 
                    ? ' Cuando |Ed| > 1, la cantidad demandada cambia más que proporcionalmente al precio.'
                    : effectiveCategory === 'inelastic'
                    ? ' Cuando |Ed| < 1, la cantidad demandada cambia menos que proporcionalmente al precio.'
                    : ' Cuando |Ed| = 1, la cantidad demandada cambia proporcionalmente al precio.'
                  }
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  El signo negativo es normal (ley de la demanda): precio ↑, cantidad ↓
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Hypothetical Badge */}
          {isHypothetical && (
            <Badge variant="warning" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Hipotético
            </Badge>
          )}
        </div>
      </div>

      {/* Hypothetical Scenario Warning */}
      {isHypothetical && warningMessage && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Escenario Hipotético:</span> {warningMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Desglose del Cálculo</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Cambio en Precio</p>
              <span className="text-[10px] text-muted-foreground/70" title="Calculado como ΔP/P̄ usando el método del punto medio">
                <HelpCircle className="h-3 w-3 inline" />
              </span>
            </div>
            <p className="text-lg font-semibold text-green-500">
              {result.percentage_change_price >= 0 ? '+' : ''}{result.percentage_change_price.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              ΔP = {result.price_change >= 0 ? '+' : ''}{result.price_change.toFixed(2)} BOB
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Cambio en Cantidad</p>
              <span className="text-[10px] text-muted-foreground/70" title="Calculado como ΔQ/Q̄ usando el método del punto medio">
                <HelpCircle className="h-3 w-3 inline" />
              </span>
            </div>
            <p className="text-lg font-semibold text-purple-500">
              {result.percentage_change_quantity >= 0 ? '+' : ''}{result.percentage_change_quantity.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              ΔQ = {result.quantity_change >= 0 ? '+' : ''}{result.quantity_change.toLocaleString('es-BO')} USDT
            </p>
          </div>
        </div>

        {/* Calculation Breakdown */}
        <div className="p-3 rounded-lg bg-muted/30 border">
          <p className="text-xs text-muted-foreground mb-2 text-center">Cálculo:</p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-serif italic">E</span><sub className="text-xs">d</sub>
            <span>=</span>
            <span className="inline-flex flex-col items-center text-xs">
              <span className="border-b border-current px-1">
                {result.percentage_change_quantity.toFixed(2)}%
              </span>
              <span className="px-1">
                {result.percentage_change_price.toFixed(2)}%
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg">{result.elasticity.toFixed(4)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            |E<sub>d</sub>| = {result.abs_value.toFixed(4)} → Demanda {result.classification === 'elastic' ? 'elástica (|E| > 1)' : result.classification === 'inelastic' ? 'inelástica (|E| < 1)' : 'unitaria (|E| = 1)'}
          </p>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
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
