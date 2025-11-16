import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { Link } from "react-router-dom"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="w-full max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 lg:h-7 lg:w-7 text-primary" />
            <div className="font-bold text-xl lg:text-2xl tracking-tight text-foreground">
              ElasticBot
            </div>
           
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Inicio
            </Link>
            <Link
              to="/analisis"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Análisis
            </Link>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contacto
            </a>
          </nav>

          <Link to="/analisis">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              Ver Análisis
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
