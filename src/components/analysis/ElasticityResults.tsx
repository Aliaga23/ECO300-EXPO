import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AIUnlockDialog } from '@/components/ui/ai-unlock-dialog'
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
  Database,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
} from 'lucide-react'
import type { ParsedElasticityCalculation } from '@/types/api'
import { useState } from 'react'
import { useAIUnlock } from '@/hooks'
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
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const { isUnlocked, isLoading: unlockLoading, unlock, lock } = useAIUnlock()

  // Use backend classification_label if available, fallback to local mapping
  const getClassificationConfig = () => {
    const backendLabel = calculation.classificationLabel
    
    switch (calculation.classification) {
      case 'ELASTIC':
        return {
          label: backendLabel || 'ELÁSTICA',
          variant: 'elastic' as const,
          icon: TrendingUp,
          description: 'La demanda es sensible a cambios de precio (|Ed| > 1)',
          color: 'text-blue-500',
        }
      case 'INELASTIC':
        return {
          label: backendLabel || 'INELÁSTICA',
          variant: 'inelastic' as const,
          icon: TrendingDown,
          description: 'La demanda es poco sensible a cambios de precio (|Ed| < 1)',
          color: 'text-red-500',
        }
      case 'UNITARY':
        return {
          label: backendLabel || 'UNITARIA',
          variant: 'unitary' as const,
          icon: Minus,
          description: 'La demanda varía proporcionalmente al precio (|Ed| = 1)',
          color: 'text-yellow-500',
        }
      default:
        return {
          label: backendLabel || 'N/A',
          variant: 'secondary' as const,
          icon: Activity,
          description: '',
          color: 'text-muted-foreground',
        }
    }
  }

  const classificationConfig = getClassificationConfig()
  const ClassificationIcon = classificationConfig.icon

  const formatDate = (date: Date | null | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'N/A'
    }
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDuration = (start: Date | null | undefined, end: Date | null | undefined) => {
    if (!start || !end || !(start instanceof Date) || !(end instanceof Date)) return 'N/A'
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A'
    const ms = end.getTime() - start.getTime()
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Handle AI interpretation button click
  const handleAIButtonClick = () => {
    if (!isUnlocked) {
      setShowUnlockDialog(true)
    } else {
      onGenerateInterpretation()
    }
  }

  // Handle unlock dialog
  const handleUnlock = (password: string): boolean => {
    const success = unlock(password)
    if (success) {
      setShowUnlockDialog(false)
      onGenerateInterpretation()
    }
    return success
  }

  const handleUnlockCancel = () => {
    setShowUnlockDialog(false)
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
        
        {/* Data Source Indicator */}
        <DataSourceBadge metadata={calculation.calculationMetadata} />
        
        {/* AI Unlock Status Indicator */}
        {!unlockLoading && (
          <div className="flex items-center gap-2 mt-2">
            {isUnlocked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 text-success text-xs cursor-pointer hover:bg-success/20 transition-colors" onClick={lock}>
                      <Unlock className="h-3 w-3" />
                      <span>IA Desbloqueada</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>IA desbloqueada - Clic para bloquear</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs">
                <Lock className="h-3 w-3" />
                <span>IA Requiere Autorización</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Reliability Warning - show prominently if not reliable */}
        {!calculation.isReliable && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
            <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Resultado inestable</p>
              <p className="text-xs text-muted-foreground mt-1">
                {calculation.reliabilityNote || 'Interpretar con cautela - los datos pueden ser insuficientes o inconsistentes.'}
              </p>
            </div>
          </div>
        )}

        {/* Hero Section - Main Results */}
        <div className={cn(
          "text-center p-6 rounded-xl border",
          calculation.isReliable 
            ? "bg-linear-to-br from-primary/10 to-primary/5 border-primary/20"
            : "bg-linear-to-br from-warning/10 to-warning/5 border-warning/20"
        )}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">Coeficiente de Elasticidad</p>
            {/* Reliability indicator badge */}
            {calculation.isReliable ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="success" className="text-xs px-1.5 py-0">
                      <ShieldCheck className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resultado confiable</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="warning" className="text-xs px-1.5 py-0">
                      <ShieldAlert className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{calculation.reliabilityNote || 'Resultado no confiable'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className={cn('text-5xl font-bold tracking-tight', classificationConfig.color)}>
              {/* Use elasticityMagnitude for display if available, otherwise coefficient */}
              {calculation.elasticityMagnitude?.toFixed(4) 
                ?? calculation.elasticityCoefficient?.toFixed(4) 
                ?? 'N/A'}
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
                {calculation.calculationMetadata?.data_source && (
                  <div>
                    <span className="text-muted-foreground">Fuente de Datos:</span>
                    <p className="font-medium">
                      {calculation.calculationMetadata.data_source.type === 'external_ohlc_api' 
                        ? 'OHLC Externo' 
                        : calculation.calculationMetadata.data_source.type}
                      {calculation.calculationMetadata.data_source.timeframe && 
                        ` (${calculation.calculationMetadata.data_source.timeframe})`}
                    </p>
                  </div>
                )}
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
            onClick={handleAIButtonClick}
            disabled={interpretationLoading || unlockLoading}
          >
            <Brain className="mr-2 h-4 w-4" />
            {!isUnlocked && <Lock className="mr-1 h-3 w-3" />}
            {interpretationLoading ? 'Generando...' : 
             !isUnlocked ? 'Desbloquear IA' : 
             'Generar Interpretación IA'}
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

        {/* AI Unlock Dialog */}
        <AIUnlockDialog
          open={showUnlockDialog}
          onUnlock={handleUnlock}
          onCancel={handleUnlockCancel}
        />
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

// Data source badge component - reads from calculation metadata
interface DataSourceBadgeProps {
  metadata: ParsedElasticityCalculation['calculationMetadata']
}

function DataSourceBadge({ metadata }: DataSourceBadgeProps) {
  if (!metadata?.data_source) return null
  
  const { type, timeframe, quality_score } = metadata.data_source
  
  // Format display based on source type
  const isExternalOHLC = type === 'external_ohlc_api'
  const sourceLabel = isExternalOHLC ? 'OHLC Externo' : type
  const timeframeLabel = timeframe || '1h'
  const qualityLabel = quality_score && quality_score >= 0.9 ? 'Alta Calidad' : undefined
  
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
        <Database className="h-3 w-3" />
        <span>Fuente: {sourceLabel} ({timeframeLabel})</span>
        {qualityLabel && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1">
            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
            {qualityLabel}
          </Badge>
        )}
      </div>
    </div>
  )
}
