import { Sidebar } from './Sidebar.tsx'
import { DashboardHeader } from './DashboardHeader.tsx'
import { DashboardFooter } from './DashboardFooter.tsx'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <DashboardHeader />
        <main className={cn('min-h-[calc(100vh-4rem-4rem)] p-6', className)}>
          {children}
        </main>
        <DashboardFooter />
      </div>
    </div>
  )
}
