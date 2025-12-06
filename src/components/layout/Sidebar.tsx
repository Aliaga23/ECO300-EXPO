import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  LineChart,
  Calculator,
  History,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'

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

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ className, collapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  
  // Use external collapsed state if provided, otherwise use internal state
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed
  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
        'hidden lg:block', // Hide on mobile, show on desktop
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          'flex h-16 items-center border-b border-border px-4',
          isCollapsed ? 'justify-center' : 'gap-3'
        )}>
          <Bot className="h-7 w-7 text-primary shrink-0" />
          {!isCollapsed && (
            <span className="font-bold text-xl tracking-tight">ElasticBot</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon

            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        <Separator />

        {/* Back to Home */}
        <div className="p-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className="flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Home className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Volver al Inicio</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Home className="h-5 w-5 shrink-0" />
              <span>Volver al Inicio</span>
            </Link>
          )}
        </div>

        <Separator />

        {/* Collapse Toggle */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full justify-center', isCollapsed && 'px-2')}
            onClick={handleToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Colapsar</span>
              </>
            )}
          </Button>
        </div>

        {/* Footer Info */}
        {!isCollapsed && (
          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground text-center">
              ECO-300 • UAGRM
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Análisis Econométrico
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
