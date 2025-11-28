import { Separator } from '@/components/ui/separator'

export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Academic Info */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-xs text-muted-foreground">
            <span className="font-medium">ECO-300: Economía para la Gestión</span>
            <Separator orientation="vertical" className="h-4 hidden md:block" />
            <span>Universidad Autónoma Gabriel René Moreno</span>
          </div>

          {/* Authors and Disclaimer */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-xs text-muted-foreground">
            <span>Victor Cuellar • Jorge Aliaga</span>
            <Separator orientation="vertical" className="h-4 hidden md:block" />
            <span className="text-center md:text-right">
              Investigación académica • {new Date().getFullYear()}
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/70 text-center">
            Este sistema es una herramienta de investigación académica. Los resultados no constituyen 
            asesoría financiera ni recomendaciones de inversión. El análisis de elasticidad se basa 
            en datos públicos de mercados P2P y está sujeto a limitaciones metodológicas.
          </p>
        </div>
      </div>
    </footer>
  )
}
