import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  FileText,
  Brain,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3,
  Target,
} from 'lucide-react'
import type { ParsedElasticityCalculation } from '@/types/api'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ElasticityResultsProps {
  calculation: ParsedElasticityCalculation
  onGenerateInterpretation: () => void
  onDownloadReport: () => void
  interpretationLoading?: boolean
  reportLoading?: boolean
}

export function ElasticityResults({
  calculation,
  onGenerateInterpretation,
  onDownloadReport,
  interpretationLoading = false,
  reportLoading = false,
}: ElasticityResultsProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getClassificationConfig = () => {
    switch (calculation.classification) {
      case 'ELASTIC':
        return {
          label: 'ELÁSTICA',
          variant: 'elastic' as const,
          icon: TrendingUp,
          description: 'La demanda es sensible a cambios de precio (|Ed| > 1)',
          color: 'text-blue-500',
        }
      case 'INELASTIC':
        return {
          label: 'INELÁSTICA',
          variant: 'inelastic' as const,
          icon: TrendingDown,
          description: 'La demanda es poco sensible a cambios de precio (|Ed| < 1)',
          color: 'text-red-500',
        }
      case 'UNITARY':
        return {
          label: 'UNITARIA',
          variant: 'unitary' as const,
          icon: Minus,
          description: 'La demanda varía proporcionalmente al precio (|Ed| = 1)',
          color: 'text-yellow-500',
        }
      default:
        return {
          label: 'N/A',
          variant: 'secondary' as const,
          icon: Activity,
          description: '',
          color: 'text-muted-foreground',
        }
    }
  }

  const classificationConfig = getClassificationConfig()
  const ClassificationIcon = classificationConfig.icon

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'N/A'
    const ms = end.getTime() - start.getTime()
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Resultados del Análisis
            </CardTitle>
            <CardDescription>
              Cálculo completado el {formatDate(calculation.createdAt)}
            </CardDescription>
          </div>
          <Badge
            variant={calculation.status === 'COMPLETED' ? 'success' : 'destructive'}
            className="flex items-center gap-1"
          >
            {calculation.status === 'COMPLETED' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {calculation.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Hero Section - Main Results */}
        <div className="text-center p-6 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-2">Coeficiente de Elasticidad</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className={cn('text-5xl font-bold tracking-tight', classificationConfig.color)}>
              {calculation.elasticityCoefficient?.toFixed(4) || 'N/A'}
            </span>
          </div>
          <Badge variant={classificationConfig.variant} className="text-sm px-4 py-1">
            <ClassificationIcon className="h-4 w-4 mr-1" />
            Demanda {classificationConfig.label}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {classificationConfig.description}
          </p>
        </div>

        {/* Confidence Interval */}
        {calculation.confidenceInterval && (
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Intervalo de Confianza (95%)</span>
              <Badge variant="outline">
                [{calculation.confidenceInterval.lower.toFixed(4)}, {calculation.confidenceInterval.upper.toFixed(4)}]
              </Badge>
            </div>
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-primary/30"
                style={{
                  left: `${((calculation.confidenceInterval.lower + 3) / 6) * 100}%`,
                  right: `${100 - ((calculation.confidenceInterval.upper + 3) / 6) * 100}%`,
                }}
              />
              <div
                className="absolute w-1 h-full bg-primary"
                style={{
                  left: `${((calculation.elasticityCoefficient || 0) + 3) / 6 * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>-3.0</span>
              <span>0</span>
              <span>+3.0</span>
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BarChart3}
            label="R-cuadrado"
            value={calculation.rSquared ? `${(calculation.rSquared * 100).toFixed(1)}%` : 'N/A'}
            sublabel="Bondad de ajuste"
          />
          <StatCard
            icon={Target}
            label="Error Estándar"
            value={calculation.standardError?.toFixed(4) || 'N/A'}
            sublabel="Precisión"
          />
          <StatCard
            icon={Activity}
            label="Puntos de Datos"
            value={calculation.dataPointsUsed?.toString() || 'N/A'}
            sublabel="Observaciones"
          />
          <StatCard
            icon={calculation.isSignificant ? CheckCircle2 : XCircle}
            label="Significancia"
            value={calculation.isSignificant ? 'Sí' : 'No'}
            sublabel="Estadística"
            valueColor={calculation.isSignificant ? 'text-green-500' : 'text-red-500'}
          />
        </div>

        {/* Data Quality */}
        {calculation.averageDataQuality !== null && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Calidad Promedio de Datos</span>
            <div className="flex items-center gap-2">
              <Progress
                value={calculation.averageDataQuality * 100}
                className="w-24 h-2"
              />
              <Badge
                variant={
                  calculation.averageDataQuality >= 0.8 ? 'success' :
                  calculation.averageDataQuality >= 0.5 ? 'warning' : 'destructive'
                }
              >
                {(calculation.averageDataQuality * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
        )}

        {/* Collapsible Methodology Details */}
        <div className="border rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="text-sm font-medium">Detalles de Metodología</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showDetails && (
            <div className="p-4 pt-0 space-y-3 text-sm">
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Método:</span>
                  <p className="font-medium capitalize">{calculation.method}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ventana:</span>
                  <p className="font-medium capitalize">{calculation.windowSize}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Período:</span>
                  <p className="font-medium">
                    {formatDate(calculation.startDate)} - {formatDate(calculation.endDate)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tiempo de Cálculo:</span>
                  <p className="font-medium">
                    {formatDuration(calculation.createdAt, calculation.completedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  ID: {calculation.id}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onGenerateInterpretation}
            disabled={interpretationLoading}
          >
            <Brain className="mr-2 h-4 w-4" />
            {interpretationLoading ? 'Generando...' : 'Generar Interpretación IA'}
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={onDownloadReport}
            disabled={reportLoading}
          >
            <FileText className="mr-2 h-4 w-4" />
            {reportLoading ? 'Descargando...' : 'Descargar Reporte PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sublabel: string
  valueColor?: string
}

function StatCard({ icon: Icon, label, value, sublabel, valueColor }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 text-center">
      <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-bold', valueColor)}>{value}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
  )
}
