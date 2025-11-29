import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw, Calendar } from 'lucide-react'
import type { CalculationStatusResponse, ParsedElasticityCalculation } from '@/types/api'

interface CalculationStatusModalProps {
  open: boolean
  status: CalculationStatusResponse | null
  elapsedTime: number
  error: string | null
  failed: boolean // True when calculation finished with FAILED status
  failedCalculation: ParsedElasticityCalculation | null // The failed calculation with error_message
  onCancel: () => void
  onRetry?: () => void // Called when user wants to try again
}

export function CalculationStatusModal({
  open,
  status,
  elapsedTime,
  error,
  failed,
  failedCalculation,
  onCancel,
  onRetry,
}: CalculationStatusModalProps) {
  const getStatusConfig = () => {
    // Handle FAILED status with calculation error message
    if (failed && failedCalculation) {
      return {
        icon: AlertCircle,
        iconColor: 'text-destructive',
        title: 'Cálculo Fallido',
        description: failedCalculation.errorMessage || 'No se pudo completar el cálculo con los datos disponibles.',
        progress: 0,
        showProgress: false,
        isFailed: true,
      }
    }
    
    if (error) {
      return {
        icon: XCircle,
        iconColor: 'text-destructive',
        title: 'Error en el Cálculo',
        description: error,
        progress: 0,
        showProgress: false,
        isFailed: true,
      }
    }

    switch (status?.status) {
      case 'PENDING':
        return {
          icon: Clock,
          iconColor: 'text-muted-foreground',
          title: 'Preparando Cálculo',
          description: 'Validando parámetros y preparando los datos...',
          progress: 10,
          showProgress: true,
          isFailed: false,
        }
      case 'PROCESSING':
        return {
          icon: Spinner,
          iconColor: 'text-primary',
          title: 'Analizando Datos de Mercado',
          description: 'Procesando datos históricos y calculando elasticidad...',
          progress: 50,
          showProgress: true,
          isFailed: false,
        }
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          iconColor: 'text-green-500',
          title: 'Cálculo Completado',
          description: 'Los resultados están listos para visualizar.',
          progress: 100,
          showProgress: false,
          isFailed: false,
        }
      case 'FAILED':
        return {
          icon: AlertCircle,
          iconColor: 'text-destructive',
          title: 'Cálculo Fallido',
          description: 'No se pudo completar el cálculo.',
          progress: 0,
          showProgress: false,
          isFailed: true,
        }
      default:
        return {
          icon: Spinner,
          iconColor: 'text-primary',
          title: 'Iniciando...',
          description: 'Conectando con el servidor de análisis...',
          progress: 5,
          showProgress: true,
          isFailed: false,
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} segundos`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={config.iconColor}>
              {config.icon === Spinner ? (
                <Spinner size="lg" className={config.iconColor} />
              ) : (
                <Icon className="h-8 w-8" />
              )}
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {config.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Progress Bar */}
          {config.showProgress && (
            <div className="space-y-2">
              <Progress value={config.progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progreso estimado</span>
                <span>{config.progress}%</span>
              </div>
            </div>
          )}

          {/* Status Details */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tiempo transcurrido</span>
            </div>
            <Badge variant="secondary">{formatElapsedTime(elapsedTime)}</Badge>
          </div>

          {status && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Estado actual</span>
              <Badge
                variant={
                  status.status === 'COMPLETED' ? 'success' :
                  status.status === 'FAILED' ? 'destructive' :
                  'secondary'
                }
              >
                {status.status}
              </Badge>
            </div>
          )}

          {/* Helpful Tips */}
          {config.showProgress && elapsedTime > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              El análisis está procesando datos históricos. 
              Esto normalmente toma entre 5-15 segundos.
            </p>
          )}

          {elapsedTime > 30 && !config.isFailed && (
            <p className="text-xs text-yellow-500 text-center">
              El cálculo está tardando más de lo esperado. 
              Puede cancelar e intentar con un rango de fechas menor.
            </p>
          )}
          
          {/* FAILED status specific guidance */}
          {config.isFailed && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-destructive mb-1">Sugerencia:</p>
                  <p>
                    Verifique que el rango de fechas seleccionado tenga datos OHLC disponibles.
                    Intente con un período más reciente o más corto.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {config.isFailed ? (
            <>
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
              {onRetry && (
                <Button
                  variant="default"
                  onClick={onRetry}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ajustar y Reintentar
                </Button>
              )}
            </>
          ) : config.showProgress ? (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Cancelar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
