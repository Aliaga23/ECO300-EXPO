import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectOption } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calculator, AlertCircle, Clock, Database, Info } from 'lucide-react'
import { useDataCoverage } from '@/hooks'
import type { CalculationMethod, WindowSize, CalculationRequest } from '@/types/api'

interface ElasticityFormProps {
  onSubmit: (request: CalculationRequest) => Promise<void>
  loading: boolean
  disabled?: boolean
  rateLimitRemaining?: number
  failedMessage?: string | null // Error message from a failed calculation
  onClearError?: () => void
}

export function ElasticityForm({
  onSubmit,
  loading,
  disabled = false,
  rateLimitRemaining = 10,
  failedMessage,
  onClearError,
}: ElasticityFormProps) {
  const { coverage, loading: coverageLoading } = useDataCoverage()

  // Compute date constraints from coverage data
  const { minDate, maxDate, defaultStartDate, defaultEndDate } = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Fallback values
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    const fallbackStart = thirtyDaysAgo.toISOString().split('T')[0]
    
    if (coverage && coverage.min_date && coverage.max_date) {
      try {
        const minDateObj = new Date(coverage.min_date)
        const maxDateObj = new Date(coverage.max_date)
        
        // Validate dates are valid
        if (isNaN(minDateObj.getTime()) || isNaN(maxDateObj.getTime())) {
          throw new Error('Invalid date')
        }
        
        const coverageMin = minDateObj.toISOString().split('T')[0]
        const coverageMax = maxDateObj.toISOString().split('T')[0]
        
        // Default to 7 days before max date
        const sevenDaysBeforeMax = new Date(maxDateObj)
        sevenDaysBeforeMax.setDate(maxDateObj.getDate() - 7)
        
        const effectiveStartDate = sevenDaysBeforeMax < minDateObj 
          ? coverageMin 
          : sevenDaysBeforeMax.toISOString().split('T')[0]
        
        return {
          minDate: coverageMin,
          maxDate: coverageMax,
          defaultStartDate: effectiveStartDate,
          defaultEndDate: coverageMax,
        }
      } catch {
        // If date parsing fails, use fallback
        console.warn('Invalid coverage dates, using fallback')
      }
    }
    
    // Fallback to last 30 days if no coverage data or invalid dates
    return {
      minDate: undefined,
      maxDate: todayStr,
      defaultStartDate: fallbackStart,
      defaultEndDate: todayStr,
    }
  }, [coverage])

  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [method, setMethod] = useState<CalculationMethod>('midpoint')
  const [windowSize, setWindowSize] = useState<WindowSize>('hourly') // Default to hourly for OHLC
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Update dates when coverage data loads
  useEffect(() => {
    if (coverage && !coverageLoading) {
      setStartDate(defaultStartDate)
      setEndDate(defaultEndDate)
    }
  }, [coverage, coverageLoading, defaultStartDate, defaultEndDate])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate that dates are not empty
    if (!startDate) {
      newErrors.startDate = 'Seleccione una fecha de inicio'
    }
    if (!endDate) {
      newErrors.endDate = 'Seleccione una fecha final'
    }

    // If basic validation failed, return early
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }

    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59')
    const now = new Date()

    // Validate date objects are valid
    if (isNaN(start.getTime())) {
      newErrors.startDate = 'Fecha de inicio inválida'
    }
    if (isNaN(end.getTime())) {
      newErrors.endDate = 'Fecha final inválida'
    }

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
    
    // Method-specific minimum days validation
    if (method === 'regression' && diffDays < 14) {
      newErrors.endDate = 'Regresión requiere al menos 14 días de datos'
    }
    if (method === 'midpoint' && diffDays < 7) {
      newErrors.endDate = 'Punto medio requiere al menos 7 días de datos'
    }
    
    // Validate against coverage data if available AND valid
    if (coverage && coverage.min_date && coverage.max_date) {
      try {
        const coverageMinDate = new Date(coverage.min_date)
        const coverageMaxDate = new Date(coverage.max_date)
        
        if (!isNaN(coverageMinDate.getTime()) && !isNaN(coverageMaxDate.getTime())) {
          if (start < coverageMinDate) {
            newErrors.startDate = `Datos disponibles desde ${coverageMinDate.toLocaleDateString('es-BO')}`
          }
          
          if (end > coverageMaxDate) {
            newErrors.endDate = `Datos disponibles hasta ${coverageMaxDate.toLocaleDateString('es-BO')}`
          }
        }
      } catch {
        // Ignore coverage validation if dates are invalid
        console.warn('Coverage dates are invalid, skipping coverage validation')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous error when submitting
    if (onClearError) onClearError()
    
    // Debug current values
    console.log('Current form values:', {
      startDate,
      endDate,
      method,
      windowSize,
      defaultStartDate,
      defaultEndDate
    })
    
    if (!validate()) {
      console.log('Validation failed:', errors)
      return
    }

    // Build ISO dates with explicit UTC time components
    // startDate input is YYYY-MM-DD, add T00:00:00Z for start of day
    // endDate input is YYYY-MM-DD, add T23:59:59Z for end of day
    const startDateISO = new Date(startDate + 'T00:00:00Z').toISOString()
    const endDateISO = new Date(endDate + 'T23:59:59Z').toISOString()

    const request: CalculationRequest = {
      method,
      start_date: startDateISO,
      end_date: endDateISO,
      window_size: windowSize,
    }

    // Debug logging
    console.log('Elasticity Request:', JSON.stringify(request, null, 2))

    await onSubmit(request)
  }
  
  // Format the data source label from coverage (with validation)
  const coverageDisplay = useMemo(() => {
    if (!coverage || !coverage.source || !coverage.min_date || !coverage.max_date) {
      return null
    }
    
    try {
      const minDateObj = new Date(coverage.min_date)
      const maxDateObj = new Date(coverage.max_date)
      
      // Validate dates are valid
      if (isNaN(minDateObj.getTime()) || isNaN(maxDateObj.getTime())) {
        return null
      }
      
      const sourceLabel = coverage.source === 'external_ohlc_api' ? 'OHLC Externo' : 
                          coverage.source === 'p2p_scrape_json' ? 'P2P Scraper' : coverage.source
      const recordCount = coverage.total_snapshots ?? 0
      
      return {
        sourceLabel: `${sourceLabel} (${recordCount} registros)`,
        dateRange: `${minDateObj.toLocaleDateString('es-BO')} - ${maxDateObj.toLocaleDateString('es-BO')}`,
      }
    } catch {
      return null
    }
  }, [coverage])

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
        
        {/* Data Source Indicator - only show when coverage data is valid */}
        {coverageDisplay && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3 p-2 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Fuente: {coverageDisplay.sourceLabel}
              </span>
            </div>
            <Badge variant="outline" className="text-xs sm:ml-auto">
              {coverageDisplay.dateRange}
            </Badge>
          </div>
        )}
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
                min={minDate}
                max={maxDate}
                disabled={loading || disabled || coverageLoading}
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
                min={minDate}
                max={maxDate}
                disabled={loading || disabled || coverageLoading}
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
                  ? 'Fórmula de elasticidad arco usando promedios (mínimo 7 días)'
                  : 'Regresión logarítmica para estimación de elasticidad constante (mínimo 14 días)'
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
          
          {/* Failed Calculation Message */}
          {failedMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <span className="font-medium">El cálculo no pudo completarse:</span>
                <span>{failedMessage}</span>
                {coverage && (
                  <span className="text-xs mt-1">
                    <Info className="h-3 w-3 inline mr-1" />
                    Intente con fechas entre {new Date(coverage.min_date).toLocaleDateString('es-BO')} y {new Date(coverage.max_date).toLocaleDateString('es-BO')}
                  </span>
                )}
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
            {coverage?.source === 'external_ohlc_api' 
              ? 'Análisis basado en velas OHLC de alta calidad (datos horarios)'
              : 'El cálculo puede tomar entre 5-15 segundos dependiendo del volumen de datos'
            }
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
