import { Mail, Github, FileText } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 lg:py-16 border-t border-border">
      <div className="w-full max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="space-y-4">
            <div className="font-bold text-xl tracking-tight text-foreground">Análisis USDT/BOB</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Proyecto académico de investigación sobre elasticidad de demanda de criptomonedas en Bolivia.
            </p>
          </div>

          <div className="space-y-4">
            <div className="font-semibold text-sm text-foreground">Herramientas</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Calculadora de Elasticidad
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Predictor con IA
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Análisis de Mercado
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="font-semibold text-sm text-foreground">Contacto</div>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary transition-colors text-foreground"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary transition-colors text-foreground"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary transition-colors text-foreground"
              >
                <FileText className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Proyecto Académico USDT/BOB. Investigación Universitaria.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Documentación
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Metodología
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
