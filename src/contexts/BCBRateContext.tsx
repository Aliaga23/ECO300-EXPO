import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useBCBRate } from '@/hooks'
import type { BCBRateType, ExchangeRateDetail, PremiumMetrics } from '@/types/api'

// Local storage key for persisting user preference
const RATE_TYPE_STORAGE_KEY = 'bcb_rate_type_preference'

// Context interface
interface BCBRateContextValue {
  selectedRateType: BCBRateType
  setSelectedRateType: (type: BCBRateType) => void
  officialRate: ExchangeRateDetail | null
  referentialRate: ExchangeRateDetail | null
  currentRate: ExchangeRateDetail | null // Selected rate
  loading: boolean
  error: Error | null
}

// Create context with default values
const BCBRateContext = createContext<BCBRateContextValue | undefined>(undefined)

// Provider props
interface BCBRateProviderProps {
  children: ReactNode
  officialRate: ExchangeRateDetail | null
  referentialRate: ExchangeRateDetail | null
  loading: boolean
  error: Error | null
}

// Provider component
export function BCBRateProvider({ 
  children, 
  officialRate, 
  referentialRate, 
  loading, 
  error 
}: BCBRateProviderProps) {
  const [selectedRateType, setSelectedRateTypeState] = useState<BCBRateType>('official')

  // Load saved preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RATE_TYPE_STORAGE_KEY)
      if (saved && (saved === 'official' || saved === 'referential')) {
        setSelectedRateTypeState(saved as BCBRateType)
      }
    } catch (err) {
      console.warn('Failed to load BCB rate type preference from localStorage:', err)
    }
  }, [])

  // Save preference to localStorage when it changes
  const setSelectedRateType = (type: BCBRateType) => {
    setSelectedRateTypeState(type)
    try {
      localStorage.setItem(RATE_TYPE_STORAGE_KEY, type)
    } catch (err) {
      console.warn('Failed to save BCB rate type preference to localStorage:', err)
    }
  }

  // Get current selected rate
  const currentRate = selectedRateType === 'official' ? officialRate : referentialRate

  const contextValue: BCBRateContextValue = {
    selectedRateType,
    setSelectedRateType,
    officialRate,
    referentialRate,
    currentRate,
    loading,
    error,
  }

  return (
    <BCBRateContext.Provider value={contextValue}>
      {children}
    </BCBRateContext.Provider>
  )
}

// Global wrapper that fetches BCB rates and provides context
export function BCBRateProviderWrapper({ children }: { children: ReactNode }) {
  const { officialRate, referentialRate, loading, error } = useBCBRate()
  
  return (
    <BCBRateProvider 
      officialRate={officialRate} 
      referentialRate={referentialRate} 
      loading={loading} 
      error={error ? new Error(error) : null}
    >
      {children}
    </BCBRateProvider>
  )
}

// Hook to use the context
export function useBCBRateContext(): BCBRateContextValue {
  const context = useContext(BCBRateContext)
  if (context === undefined) {
    throw new Error('useBCBRateContext must be used within a BCBRateProvider')
  }
  return context
}

// Utility function to calculate premium metrics
export function calculatePremium(
  usdtPrice: number,
  bcbRate: ExchangeRateDetail,
  rateType: BCBRateType
): PremiumMetrics {
  const bcbSellRate = parseFloat(bcbRate.sell)
  const premiumAbsolute = usdtPrice - bcbSellRate
  const premiumPercentage = (premiumAbsolute / bcbSellRate) * 100
  const isAboveBcb = premiumAbsolute > 0

  return {
    usdt_price: usdtPrice,
    bcb_rate: bcbSellRate,
    bcb_rate_type: rateType,
    premium_absolute: premiumAbsolute,
    premium_percentage: premiumPercentage,
    is_above_bcb: isAboveBcb,
  }
}

// Helper to format rate type for display
export function formatRateType(rateType: BCBRateType): string {
  return rateType === 'official' ? 'Oficial' : 'Referencial'
}

// Helper to get rate description
export function getRateDescription(rateType: BCBRateType): string {
  return rateType === 'official' 
    ? 'Tipo de cambio del BCB para operaciones en el sistema financiero formal'
    : 'Valor de referencia del BCB que refleja condiciones de mercado más amplias'
}

// Helper to check if rate type is available
export function isRateTypeAvailable(
  rateType: BCBRateType,
  officialRate: ExchangeRateDetail | null,
  referentialRate: ExchangeRateDetail | null
): boolean {
  if (rateType === 'official') {
    return officialRate !== null
  }
  return referentialRate !== null
}
