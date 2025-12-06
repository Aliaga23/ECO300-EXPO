import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectOption } from '@/components/ui/select'
import { useCalculationHistory, formatDataSource } from '@/hooks'
import type { CalculationSummary, CalculationStatus, CalculationMethod } from '@/types/api'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  History,
  Filter,
  Database,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalculationHistoryTableProps {
  onViewCalculation: (id: string) => void
}

export function CalculationHistoryTable({ onViewCalculation }: CalculationHistoryTableProps) {
  const { history, loading, error, refresh } = useCalculationHistory()
  const [statusFilter, setStatusFilter] = useState<CalculationStatus | 'ALL'>('ALL')
  const [methodFilter, setMethodFilter] = useState<CalculationMethod | 'ALL'>('ALL')

  const filteredHistory = history.filter((calc) => {
    if (statusFilter !== 'ALL' && calc.status !== statusFilter) return false
    if (methodFilter !== 'ALL' && calc.method !== methodFilter) return false
    return true
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusConfig = (status: CalculationStatus) => {
    switch (status) {
      case 'COMPLETED':
        return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10' }
      case 'PROCESSING':
        return { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', animate: true }
      case 'FAILED':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' }
      case 'PENDING':
      default:
        return { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted' }
    }
  }

  if (loading && !history.length) {
    return <HistoryTableSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Historial de Cálculos</CardTitle>
              <CardDescription>Últimos cálculos realizados desde esta IP</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar:</span>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CalculationStatus | 'ALL')}
            className="w-36"
          >
            <SelectOption value="ALL">Todo Estado</SelectOption>
            <SelectOption value="COMPLETED">Completado</SelectOption>
            <SelectOption value="PROCESSING">Procesando</SelectOption>
            <SelectOption value="FAILED">Fallido</SelectOption>
            <SelectOption value="PENDING">Pendiente</SelectOption>
          </Select>
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as CalculationMethod | 'ALL')}
            className="w-36"
          >
            <SelectOption value="ALL">Todo Método</SelectOption>
            <SelectOption value="midpoint">Midpoint</SelectOption>
            <SelectOption value="regression">Regresión</SelectOption>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={refresh}>
              Reintentar
            </Button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No hay cálculos registrados</p>
            <p className="text-sm mt-1">
              {history.length === 0 
                ? 'Comience analizando datos de mercado'
                : 'Ajuste los filtros para ver resultados'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Método</th>
                    <th className="text-left py-3 px-2 font-medium">Coeficiente</th>
                    <th className="text-left py-3 px-2 font-medium">Clasificación</th>
                    <th className="text-left py-3 px-2 font-medium">Fuente</th>
                    <th className="text-left py-3 px-2 font-medium">Estado</th>
                    <th className="text-right py-3 px-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((calc) => (
                    <HistoryRow
                      key={calc.id}
                      calculation={calc}
                      onView={() => onViewCalculation(calc.id)}
                      formatDate={formatDate}
                      getStatusConfig={getStatusConfig}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredHistory.map((calc) => (
                <HistoryCard
                  key={calc.id}
                  calculation={calc}
                  onView={() => onViewCalculation(calc.id)}
                  formatDate={formatDate}
                  getStatusConfig={getStatusConfig}
                />
              ))}
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
              Mostrando {filteredHistory.length} de {history.length} cálculos
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface RowProps {
  calculation: CalculationSummary
  onView: () => void
  formatDate: (date: string) => string
  getStatusConfig: (status: CalculationStatus) => { 
    icon: typeof CheckCircle2
    color: string
    bgColor: string
    animate?: boolean
  }
}

function HistoryRow({ calculation, onView, formatDate, getStatusConfig }: RowProps) {
  const statusConfig = getStatusConfig(calculation.status)
  const StatusIcon = statusConfig.icon
  
  // Extract data source info from calculation_metadata
  const dataSourceType = calculation.calculation_metadata?.data_source?.type
  const isExternalBinance = dataSourceType === 'binance_api' || dataSourceType === 'external_ohlc_api'
  const dataPointsUsed = calculation.data_points_used

  return (
    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
      <td className="py-3 px-2">{formatDate(calculation.created_at)}</td>
      <td className="py-3 px-2">
        <Badge variant="outline" className="capitalize text-xs">
          {calculation.method}
        </Badge>
      </td>
      <td className="py-3 px-2 font-mono">
        {calculation.elasticity_coefficient 
          ? parseFloat(calculation.elasticity_coefficient).toFixed(4)
          : '—'
        }
      </td>
      <td className="py-3 px-2">
        {calculation.classification ? (
          <Badge
            variant={
              calculation.classification === 'ELASTIC' ? 'elastic' :
              calculation.classification === 'INELASTIC' ? 'inelastic' : 'unitary'
            }
            className="text-xs"
          >
            {calculation.classification}
          </Badge>
        ) : '—'}
      </td>
      <td className="py-3 px-2">
        {dataSourceType ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-xs">
              <Database className="h-3 w-3 text-primary" />
              <span className={isExternalBinance ? 'text-primary' : ''}>
                {isExternalBinance ? 'Binance' : formatDataSource(dataSourceType)}
              </span>
            </div>
            {dataPointsUsed != null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                <span>{dataPointsUsed} pts</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-2">
        <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs', statusConfig.bgColor)}>
          <StatusIcon className={cn('h-3 w-3', statusConfig.color, statusConfig.animate && 'animate-spin')} />
          <span className={statusConfig.color}>{calculation.status}</span>
        </div>
      </td>
      <td className="py-3 px-2 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          disabled={calculation.status !== 'COMPLETED'}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}

function HistoryCard({ calculation, onView, formatDate, getStatusConfig }: RowProps) {
  const statusConfig = getStatusConfig(calculation.status)
  const StatusIcon = statusConfig.icon
  
  // Extract data source info from calculation_metadata
  const dataSourceType = calculation.calculation_metadata?.data_source?.type
  const isExternalBinance = dataSourceType === 'binance_api' || dataSourceType === 'external_ohlc_api'
  const dataPointsUsed = calculation.data_points_used

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{formatDate(calculation.created_at)}</span>
        <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs', statusConfig.bgColor)}>
          <StatusIcon className={cn('h-3 w-3', statusConfig.color, statusConfig.animate && 'animate-spin')} />
          <span className={statusConfig.color}>{calculation.status}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Badge variant="outline" className="capitalize text-xs">
            {calculation.method}
          </Badge>
          {calculation.classification && (
            <Badge
              variant={
                calculation.classification === 'ELASTIC' ? 'elastic' :
                calculation.classification === 'INELASTIC' ? 'inelastic' : 'unitary'
              }
              className="text-xs ml-2"
            >
              {calculation.classification}
            </Badge>
          )}
        </div>
        <span className="text-xl font-mono font-bold">
          {calculation.elasticity_coefficient 
            ? parseFloat(calculation.elasticity_coefficient).toFixed(4)
            : '—'
          }
        </span>
      </div>
      
      {/* Data Source Info */}
      {dataSourceType && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-primary" />
            <span className={isExternalBinance ? 'text-primary' : ''}>
              {isExternalBinance ? 'Binance Externo' : formatDataSource(dataSourceType)}
            </span>
          </div>
          {dataPointsUsed != null && (
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>{dataPointsUsed} puntos</span>
            </div>
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onView}
        disabled={calculation.status !== 'COMPLETED'}
      >
        <Eye className="h-4 w-4 mr-2" />
        Ver Detalles
      </Button>
    </div>
  )
}

function HistoryTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
