import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="py-12 lg:py-16 border-t border-border bg-background">
      <div className="w-full max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="space-y-4">
            <div className="font-bold text-xl tracking-tight text-foreground">ElasticBot</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Proyecto académico de investigación sobre elasticidad de demanda de criptomonedas en Bolivia.
            </p>
          </div>

          <div className="space-y-4">
            <div className="font-semibold text-sm text-foreground">Herramientas</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/dashboard/analisis" className="hover:text-foreground transition-colors">
                  Calculadora de Elasticidad
                </Link>
              </li>
              <li>
                <Link to="/dashboard/simulador" className="hover:text-foreground transition-colors">
                  Simulador de Escenarios
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Panel de Control
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="font-semibold text-sm text-foreground">Recursos</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/dashboard/documentacion" className="hover:text-foreground transition-colors">
                  Documentación
                </Link>
              </li>
              <li>
                <Link to="/dashboard/historial" className="hover:text-foreground transition-colors">
                  Historial de Cálculos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ECO-300 • UAGRM • Economía para la Gestión
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/dashboard/documentacion" className="hover:text-foreground transition-colors">
              Documentación
            </Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
