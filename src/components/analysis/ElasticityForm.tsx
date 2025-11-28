import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectOption } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calculator, AlertCircle, Clock } from 'lucide-react'
import type { CalculationMethod, WindowSize, CalculationRequest } from '@/types/api'

interface ElasticityFormProps {
  onSubmit: (request: CalculationRequest) => Promise<void>
  loading: boolean
  disabled?: boolean
  rateLimitRemaining?: number
}

export function ElasticityForm({
  onSubmit,
  loading,
  disabled = false,
  rateLimitRemaining = 10,
}: ElasticityFormProps) {
  // Default to last 30 days
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  const [method, setMethod] = useState<CalculationMethod>('midpoint')
  const [windowSize, setWindowSize] = useState<WindowSize>('daily')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (start > now) {
      newErrors.startDate = 'La fecha de inicio no puede ser futura'
    }

    if (end > now) {
      newErrors.endDate = 'La fecha final no puede ser futura'
    }

    if (start >= end) {
      newErrors.endDate = 'La fecha final debe ser posterior a la inicial'
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 90) {
      newErrors.endDate = 'El rango máximo es de 90 días'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    const request: CalculationRequest = {
      method,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate + 'T23:59:59').toISOString(),
      window_size: windowSize,
    }

    await onSubmit(request)
  }

  const isRateLimited = rateLimitRemaining <= 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Calcular Elasticidad de Precio</CardTitle>
          </div>
          <Badge 
            variant={rateLimitRemaining <= 2 ? 'destructive' : rateLimitRemaining <= 5 ? 'warning' : 'secondary'}
          >
            {rateLimitRemaining}/10 cálculos disponibles
          </Badge>
        </div>
        <CardDescription>
          Seleccione el período y método de análisis para calcular la elasticidad de demanda USDT/BOB
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today.toISOString().split('T')[0]}
                disabled={loading || disabled}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={today.toISOString().split('T')[0]}
                disabled={loading || disabled}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Método de Cálculo</Label>
              <Select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as CalculationMethod)}
                disabled={loading || disabled}
              >
                <SelectOption value="midpoint">Punto Medio (Midpoint)</SelectOption>
                <SelectOption value="regression">Regresión Log-Log</SelectOption>
              </Select>
              <p className="text-xs text-muted-foreground">
                {method === 'midpoint' 
                  ? 'Fórmula de elasticidad arco usando promedios'
                  : 'Regresión logarítmica para estimación de elasticidad constante'
                }
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="windowSize">Ventana de Agregación</Label>
              <Select
                id="windowSize"
                value={windowSize}
                onChange={(e) => setWindowSize(e.target.value as WindowSize)}
                disabled={loading || disabled}
              >
                <SelectOption value="hourly">Por Hora</SelectOption>
                <SelectOption value="daily">Por Día</SelectOption>
                <SelectOption value="weekly">Por Semana</SelectOption>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nivel de agregación temporal para los datos de mercado
              </p>
            </div>
          </div>

          {/* Rate Limit Warning */}
          {rateLimitRemaining <= 2 && rateLimitRemaining > 0 && (
            <Alert variant="warning">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Quedan {rateLimitRemaining} cálculos disponibles esta hora. 
                Úselos con prudencia.
              </AlertDescription>
            </Alert>
          )}

          {isRateLimited && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ha alcanzado el límite de cálculos por hora. 
                Intente nuevamente más tarde.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || disabled || isRateLimited}
          >
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Elasticidad
              </>
            )}
          </Button>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground text-center">
            El cálculo puede tomar entre 5-15 segundos dependiendo del volumen de datos
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
