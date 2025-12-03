import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useBCBRateContext, getRateDescription, isRateTypeAvailable } from '@/contexts/BCBRateContext'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BCBRateTypeSelectorProps {
  size?: 'sm' | 'lg'
  showDescriptions?: boolean
  className?: string
}

export function BCBRateTypeSelector({ 
  size = 'sm', 
  showDescriptions = false,
  className 
}: BCBRateTypeSelectorProps) {
  const { 
    selectedRateType, 
    setSelectedRateType, 
    officialRate, 
    referentialRate, 
    loading 
  } = useBCBRateContext()

  const handleRateTypeChange = (value: 'official' | 'referential') => {
    setSelectedRateType(value)
  }

  // Disable options that aren't available
  const officialAvailable = isRateTypeAvailable('official', officialRate, referentialRate)
  const referentialAvailable = isRateTypeAvailable('referential', officialRate, referentialRate)

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-6 text-lg',
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', sizeClasses[size], className)}>
        <span className="text-muted-foreground">Cargando...</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className={cn('font-medium', size === 'sm' ? 'text-sm' : 'text-lg')}>
          Tipo de Cambio BCB
        </span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={14} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">{getRateDescription(selectedRateType)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <Button
          variant={selectedRateType === 'official' ? 'default' : 'ghost'}
          size={size}
          onClick={() => handleRateTypeChange('official')}
          disabled={!officialAvailable}
          className={cn(
            'flex-1 transition-all duration-200',
            selectedRateType === 'official' && 'shadow-sm',
            !officialAvailable && 'opacity-50 cursor-not-allowed'
          )}
        >
          Oficial
        </Button>
        <Button
          variant={selectedRateType === 'referential' ? 'default' : 'ghost'}
          size={size}
          onClick={() => handleRateTypeChange('referential')}
          disabled={!referentialAvailable}
          className={cn(
            'flex-1 transition-all duration-200',
            selectedRateType === 'referential' && 'shadow-sm',
            !referentialAvailable && 'opacity-50 cursor-not-allowed'
          )}
        >
          Referencial
        </Button>
      </div>

      {showDescriptions && (
        <p className="text-xs text-muted-foreground italic">
          {getRateDescription(selectedRateType)}
        </p>
      )}

      {/* Show warnings if rate types are unavailable */}
      {!referentialAvailable && !loading && (
        <p className="text-xs text-orange-600 font-medium">
          Valor referencial no disponible actualmente
        </p>
      )}
    </div>
  )
}

// Compact version for smaller spaces - redesigned for perfect alignment
export function BCBRateTypeSelectorCompact({ 
  className 
}: { 
  className?: string 
}) {
  const { 
    selectedRateType, 
    setSelectedRateType, 
    officialRate, 
    referentialRate, 
    loading 
  } = useBCBRateContext()

  const handleRateTypeChange = (value: 'official' | 'referential') => {
    setSelectedRateType(value)
  }

  const officialAvailable = isRateTypeAvailable('official', officialRate, referentialRate)
  const referentialAvailable = isRateTypeAvailable('referential', officialRate, referentialRate)

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-9 px-4 bg-muted rounded-lg', className)}>
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    )
  }

  return (
    <div className={cn('inline-flex p-1 bg-muted rounded-lg', className)}>
      <button
        type="button"
        onClick={() => handleRateTypeChange('official')}
        disabled={!officialAvailable}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          selectedRateType === 'official'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10',
          !officialAvailable && 'opacity-50 cursor-not-allowed'
        )}
      >
        Oficial
      </button>
      <button
        type="button"
        onClick={() => handleRateTypeChange('referential')}
        disabled={!referentialAvailable}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          selectedRateType === 'referential'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10',
          !referentialAvailable && 'opacity-50 cursor-not-allowed'
        )}
      >
        Referencial
      </button>
    </div>
  )
}

export default BCBRateTypeSelector
