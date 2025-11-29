import { useState } from 'react'
import { DashboardLayout } from '@/components/layout'
import {
  ElasticityForm,
  CalculationStatusModal,
  ElasticityResults,
  InterpretationPanel,
} from '@/components/analysis'
import { MarketDataCard, BCBRateCard } from '@/components/dashboard'
import { MidpointFormulaDisplay, LogLogFormulaDisplay } from '@/components/ui/math-formula'
import { useElasticityCalculation, useInterpretation, useReports } from '@/hooks'
import type { CalculationRequest } from '@/types/api'

export default function NewAnalysisPage() {
  const {
    calculation,
    status,
    loading,
    polling,
    error,
    failed,
    elapsedTime,
    startCalculation,
    cancelPolling,
    reset: resetCalculation,
  } = useElasticityCalculation()

  const {
    interpretation,
    loading: interpretationLoading,
    error: interpretationError,
    rateLimitExceeded,
    retryAfter,
    generate: generateInterpretation,
    reset: resetInterpretation,
  } = useInterpretation()

  const { downloading, downloadPdf } = useReports()

  const [rateLimitRemaining] = useState(10) // Would track from API responses

  const handleSubmit = async (request: CalculationRequest) => {
    resetInterpretation()
    await startCalculation(request)
  }

  const handleGenerateInterpretation = () => {
    if (calculation?.id) {
      generateInterpretation(calculation.id)
    }
  }

  const handleDownloadReport = () => {
    if (calculation?.id) {
      downloadPdf(calculation.id)
    }
  }

  const handleCancelPolling = () => {
    cancelPolling()
  }

  const handleNewCalculation = () => {
    resetCalculation()
    resetInterpretation()
  }
  
  // Handle retry after a failed calculation - reset and show form
  const handleRetry = () => {
    resetCalculation()
    resetInterpretation()
  }
  
  // Get the failed message from the calculation if it failed
  const failedMessage = failed && calculation?.errorMessage ? calculation.errorMessage : null
  
  // Determine if we should show the form (no successful calculation yet)
  const showForm = !calculation || failed

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análisis de Elasticidad</h1>
            <p className="text-muted-foreground mt-1">
              Calcule la elasticidad de demanda USDT/BOB con datos reales de mercado
            </p>
          </div>
          {calculation && (
            <button
              onClick={handleNewCalculation}
              className="text-sm text-primary hover:underline"
            >
              + Nuevo cálculo
            </button>
          )}
        </div>

        {/* Market Context - Show when no calculation yet */}
        {!calculation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketDataCard />
            <BCBRateCard />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form or Results */}
          <div className="space-y-6">
            {showForm ? (
              <ElasticityForm
                onSubmit={handleSubmit}
                loading={loading || polling}
                disabled={polling}
                rateLimitRemaining={rateLimitRemaining}
                failedMessage={failedMessage}
                onClearError={resetCalculation}
              />
            ) : (
              <ElasticityResults
                calculation={calculation}
                onGenerateInterpretation={handleGenerateInterpretation}
                onDownloadReport={handleDownloadReport}
                interpretationLoading={interpretationLoading}
                reportLoading={downloading}
              />
            )}
          </div>

          {/* Right Column - Interpretation or Context */}
          <div className="space-y-6">
            {calculation && !failed ? (
              <InterpretationPanel
                interpretation={interpretation}
                loading={interpretationLoading}
                error={interpretationError}
                rateLimitExceeded={rateLimitExceeded}
                retryAfter={retryAfter}
                onGenerate={handleGenerateInterpretation}
                calculationId={calculation.id}
              />
            ) : (
              <MethodologyCard />
            )}
          </div>
        </div>

        {/* Calculation Status Modal */}
        <CalculationStatusModal
          open={polling || failed}
          status={status}
          elapsedTime={elapsedTime}
          error={error}
          failed={failed}
          failedCalculation={failed ? calculation : null}
          onCancel={handleCancelPolling}
          onRetry={handleRetry}
        />
      </div>
    </DashboardLayout>
  )
}

function MethodologyCard() {
  return (
    <div className="space-y-4">
      <div className="p-6 rounded-xl border bg-card">
        <h3 className="font-semibold mb-4">Metodologías Disponibles</h3>
        
        <div className="space-y-5">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm mb-2">Punto Medio (Midpoint)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Calcula la elasticidad arco utilizando el promedio de precios y cantidades 
              como base. Ideal para analizar cambios discretos entre dos puntos en el tiempo.
            </p>
            <MidpointFormulaDisplay />
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm mb-2">Regresión Log-Log</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Estima la elasticidad mediante regresión logarítmica, permitiendo 
              obtener un coeficiente constante a lo largo del rango de datos.
            </p>
            <LogLogFormulaDisplay />
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-card">
        <h3 className="font-semibold mb-3">Interpretación de Resultados</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0" />
            <div>
              <span className="font-medium">Demanda Elástica (|Ed| &gt; 1)</span>
              <p className="text-xs text-muted-foreground">
                La cantidad demandada es muy sensible a cambios de precio
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shrink-0" />
            <div>
              <span className="font-medium">Demanda Inelástica (|Ed| &lt; 1)</span>
              <p className="text-xs text-muted-foreground">
                La cantidad demandada es poco sensible a cambios de precio
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1 shrink-0" />
            <div>
              <span className="font-medium">Elasticidad Unitaria (|Ed| = 1)</span>
              <p className="text-xs text-muted-foreground">
                Los cambios porcentuales en precio y cantidad son iguales
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
