import { Sidebar } from './Sidebar.tsx'
import { DashboardHeader } from './DashboardHeader.tsx'
import { DashboardFooter } from './DashboardFooter.tsx'
import { MobileNav } from './MobileNav.tsx'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load saved preference from localStorage, default to false
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      {/* Mobile Navigation - hidden on desktop */}
      <MobileNav />

      {/* Main Content Area */}
      <div className={cn(
        'transition-all duration-300',
        'pt-14 lg:pt-0', // Account for mobile header
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64' // Dynamic sidebar padding based on collapse state
      )}>
        {/* Desktop Header - hidden on mobile (mobile has its own header) */}
        <div className="hidden lg:block">
          <DashboardHeader />
        </div>
        
        <main className={cn(
          'min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem-4rem)]',
          'p-4 md:p-6 lg:p-8', // Responsive padding
          className
        )}>
          {children}
        </main>
        
        <DashboardFooter />
      </div>
    </div>
  )
}
