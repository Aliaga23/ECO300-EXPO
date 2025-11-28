import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  LineChart,
  Calculator,
  History,
  BookOpen,
  Bot,
  Menu,
  X,
  Home,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Análisis', href: '/dashboard/analisis', icon: LineChart },
  { title: 'Simulador', href: '/dashboard/simulador', icon: Calculator },
  { title: 'Historial', href: '/dashboard/historial', icon: History },
  { title: 'Documentación', href: '/dashboard/documentacion', icon: BookOpen },
]

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const closeDrawer = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Header Bar */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border lg:hidden',
          className
        )}
      >
        <div className="flex items-center justify-between h-full px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">ElasticBot</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Slide-over Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ElasticBot</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDrawer}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeDrawer}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Back to Home Link */}
          <div className="p-4 border-t border-border">
            <Link
              to="/"
              onClick={closeDrawer}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Home className="h-5 w-5 shrink-0" />
              <span>Volver al Inicio</span>
            </Link>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              ECO-300 • UAGRM
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Análisis Econométrico
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
