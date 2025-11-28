import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isDark ? 'bg-slate-700' : 'bg-slate-200',
        className
      )}
    >
      {/* Sun Icon (Left) */}
      <span
        className={cn(
          'absolute left-1.5 flex h-5 w-5 items-center justify-center transition-opacity duration-200',
          isDark ? 'opacity-40' : 'opacity-100'
        )}
      >
        <Sun className={cn('h-4 w-4', isDark ? 'text-slate-400' : 'text-amber-500')} />
      </span>

      {/* Moon Icon (Right) */}
      <span
        className={cn(
          'absolute right-1.5 flex h-5 w-5 items-center justify-center transition-opacity duration-200',
          isDark ? 'opacity-100' : 'opacity-40'
        )}
      >
        <Moon className={cn('h-4 w-4', isDark ? 'text-blue-300' : 'text-slate-400')} />
      </span>

      {/* Sliding Pill */}
      <span
        className={cn(
          'absolute h-6 w-6 rounded-full shadow-md transition-all duration-300 ease-in-out',
          isDark
            ? 'left-9 bg-slate-900'
            : 'left-1 bg-white'
        )}
      />
    </button>
  )
}

// Compact version for mobile or small spaces
export function ThemeToggleCompact({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted',
        className
      )}
    >
      {isDark ? (
        <Moon className="h-5 w-5 text-blue-300" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500" />
      )}
    </button>
  )
}
