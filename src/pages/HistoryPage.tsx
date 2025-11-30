import { useState } from 'react'
import { DashboardLayout } from '@/components/layout'
import { CalculationHistoryTable, HistoricalChart } from '@/components/history'
import { ElasticityResults, InterpretationPanel } from '@/components/analysis'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCalculationResult, useInterpretation, useReports } from '@/hooks'
import { History, LineChart } from 'lucide-react'

export default function HistoryPage() {
  const [selectedCalculationId, setSelectedCalculationId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const { calculation, loading: calcLoading, load } = useCalculationResult()
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

  const handleViewCalculation = async (id: string) => {
    setSelectedCalculationId(id)
    setDialogOpen(true)
    resetInterpretation()
    await load(id)
  }

  const handleGenerateInterpretation = () => {
    if (selectedCalculationId) {
      generateInterpretation(selectedCalculationId)
    }
  }

  const handleDownloadReport = () => {
    if (selectedCalculationId) {
      downloadPdf(selectedCalculationId)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Historial</h1>
          </div>
          <p className="text-muted-foreground">
            Revise cálculos anteriores y datos históricos del mercado
          </p>
        </div>

        {/* Tabs for different history views */}
        <Tabs defaultValue="calculations">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
            <TabsTrigger value="calculations" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Cálculos</span>
              <span className="sm:hidden">Cálc.</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Mercado</span>
              <span className="sm:hidden">Merc.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculations" className="mt-6">
            <CalculationHistoryTable onViewCalculation={handleViewCalculation} />
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <HistoricalChart />
          </TabsContent>
        </Tabs>

        {/* Calculation Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>Detalle del Cálculo</DialogTitle>
            </DialogHeader>
            
            {calcLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                Cargando detalles...
              </div>
            ) : calculation ? (
              <div className="space-y-6 mt-4">
                <ElasticityResults
                  calculation={calculation}
                  onGenerateInterpretation={handleGenerateInterpretation}
                  onDownloadReport={handleDownloadReport}
                  interpretationLoading={interpretationLoading}
                  reportLoading={downloading}
                />
                
                <InterpretationPanel
                  interpretation={interpretation}
                  loading={interpretationLoading}
                  error={interpretationError}
                  rateLimitExceeded={rateLimitExceeded}
                  retryAfter={retryAfter}
                  onGenerate={handleGenerateInterpretation}
                  calculationId={selectedCalculationId || undefined}
                />
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No se pudo cargar el cálculo
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
