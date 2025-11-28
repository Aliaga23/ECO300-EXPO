import { Sidebar } from './Sidebar.tsx'
import { DashboardHeader } from './DashboardHeader.tsx'
import { DashboardFooter } from './DashboardFooter.tsx'
import { MobileNav } from './MobileNav.tsx'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />
      
      {/* Mobile Navigation - hidden on desktop */}
      <MobileNav />

      {/* Main Content Area */}
      <div className={cn(
        'transition-all duration-300',
        'pt-14 lg:pt-0', // Account for mobile header
        'lg:pl-64' // Only add sidebar padding on desktop
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
