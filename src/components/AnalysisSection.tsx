import { TradingViewChart } from "./TradingViewChart"

export function AnalysisSection() {
  return (
    <section id="analysis" className="py-0 lg:py-2">
      <div className="w-full max-w-screen-2xl mx-auto px-4">
        
        <div className="text-center mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Análisis Académico con
            <br />
            <span className="text-primary">Tecnología Avanzada</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Herramienta web que integra economía, análisis de datos e IA para estudiar la elasticidad de la demanda del USDT frente al boliviano.
          </p>
        </div>

        
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          
          <div className="space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Análisis predictivo basado en Inteligencia Artificial
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Algoritmos de machine learning entrenados con datos históricos del mercado boliviano.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Integración de datos en tiempo real del mercado P2P
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Conexión directa con exchanges para obtener precios actualizados constantemente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Modelo econométrico con 98.5% de precisión
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Validado mediante técnicas estadísticas rigurosas y pruebas de robustez.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Visualización interactiva de elasticidad de demanda
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Gráficos dinámicos que muestran la sensibilidad del mercado ante cambios de precio.
                  </p>
                </div>
              </div>
            </div>

            
            <div className="bg-muted/30 rounded-lg p-4 border-l-3 border-primary">
              <blockquote className="text-sm text-foreground font-medium italic mb-2">
                "Este proyecto contribuye a comprender el impacto de los activos digitales en la economía
                boliviana y su relación con la estabilidad monetaria."
              </blockquote>
              <div className="text-xs text-muted-foreground">Proyecto Académico 2025</div>
            </div>
          </div>

          
          <div>
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">USDT/BOB</h3>
                  <p className="text-xs text-muted-foreground">Análisis de Elasticidad</p>
                </div>
              </div>
              
              <TradingViewChart height={350} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}