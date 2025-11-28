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
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { CalculationStatusResponse } from '@/types/api'

interface CalculationStatusModalProps {
  open: boolean
  status: CalculationStatusResponse | null
  elapsedTime: number
  error: string | null
  onCancel: () => void
}

export function CalculationStatusModal({
  open,
  status,
  elapsedTime,
  error,
  onCancel,
}: CalculationStatusModalProps) {
  const getStatusConfig = () => {
    if (error) {
      return {
        icon: XCircle,
        iconColor: 'text-destructive',
        title: 'Error en el Cálculo',
        description: error,
        progress: 0,
        showProgress: false,
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
        }
      case 'PROCESSING':
        return {
          icon: Spinner,
          iconColor: 'text-primary',
          title: 'Analizando Datos de Mercado',
          description: 'Procesando datos históricos y calculando elasticidad...',
          progress: 50,
          showProgress: true,
        }
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          iconColor: 'text-green-500',
          title: 'Cálculo Completado',
          description: 'Los resultados están listos para visualizar.',
          progress: 100,
          showProgress: false,
        }
      case 'FAILED':
        return {
          icon: AlertCircle,
          iconColor: 'text-destructive',
          title: 'Error en el Cálculo',
          description: 'Ocurrió un error durante el procesamiento.',
          progress: 0,
          showProgress: false,
        }
      default:
        return {
          icon: Spinner,
          iconColor: 'text-primary',
          title: 'Iniciando...',
          description: 'Conectando con el servidor de análisis...',
          progress: 5,
          showProgress: true,
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

          {elapsedTime > 30 && (
            <p className="text-xs text-yellow-500 text-center">
              El cálculo está tardando más de lo esperado. 
              Puede cancelar e intentar con un rango de fechas menor.
            </p>
          )}
        </div>

        <DialogFooter>
          {(config.showProgress || error) && (
            <Button
              variant={error ? 'default' : 'outline'}
              onClick={onCancel}
              className="w-full"
            >
              {error ? 'Cerrar' : 'Cancelar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
