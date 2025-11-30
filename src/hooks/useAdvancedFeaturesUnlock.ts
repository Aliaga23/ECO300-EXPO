import { useState, useEffect, useCallback } from 'react';

interface UseAdvancedFeaturesUnlockReturn {
  isUnlocked: boolean;
  isLoading: boolean;
  unlock: (password: string) => boolean;
  lock: () => void;
}

// Constants for localStorage keys and expiry time
const UNLOCKED_KEY = 'elasticbot_advanced_features_unlocked';
const UNLOCKED_EXPIRY_KEY = 'elasticbot_advanced_features_unlocked_expiry';
const OLD_AI_UNLOCKED_KEY = 'elasticbot_ai_unlocked';
const OLD_AI_UNLOCKED_EXPIRY_KEY = 'elasticbot_ai_unlocked_expiry';
const EXPIRY_HOURS = 24;

export function useAdvancedFeaturesUnlock(): UseAdvancedFeaturesUnlockReturn {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get password from environment variables
  const getPassword = (): string | null => {
    // Keep using VITE_AI_PASSWORD for backward compatibility
    const password = import.meta.env.VITE_AI_PASSWORD;
    
    // Log warning in development if password is not set
    if (!password && import.meta.env.DEV) {
      console.warn('⚠️ VITE_AI_PASSWORD is not set. Advanced features will be accessible without password protection.');
    }
    
    return password || null;
  };

  // Migrate old AI unlock state to new advanced features state
  const migrateOldUnlockState = useCallback(() => {
    try {
      const oldUnlocked = localStorage.getItem(OLD_AI_UNLOCKED_KEY);
      const oldExpiry = localStorage.getItem(OLD_AI_UNLOCKED_EXPIRY_KEY);
      
      if (oldUnlocked === 'true' && oldExpiry) {
        const expiryTime = parseInt(oldExpiry, 10);
        const now = Date.now();
        
        // Only migrate if not expired
        if (now < expiryTime) {
          localStorage.setItem(UNLOCKED_KEY, 'true');
          localStorage.setItem(UNLOCKED_EXPIRY_KEY, oldExpiry);
          
          // Clean up old keys
          localStorage.removeItem(OLD_AI_UNLOCKED_KEY);
          localStorage.removeItem(OLD_AI_UNLOCKED_EXPIRY_KEY);
          
          console.log('🔄 Migrated AI unlock state to advanced features unlock');
          return true;
        } else {
          // Clean up expired old state
          localStorage.removeItem(OLD_AI_UNLOCKED_KEY);
          localStorage.removeItem(OLD_AI_UNLOCKED_EXPIRY_KEY);
        }
      }
    } catch (error) {
      // Ignore migration errors
    }
    return false;
  }, []);

  // Check if current unlock is still valid
  const checkUnlockStatus = useCallback(() => {
    // First try to migrate old state
    const migrated = migrateOldUnlockState();
    if (migrated) return true;

    try {
      const unlocked = localStorage.getItem(UNLOCKED_KEY) === 'true';
      const expiry = localStorage.getItem(UNLOCKED_EXPIRY_KEY);
      
      if (unlocked && expiry) {
        const expiryTime = parseInt(expiry, 10);
        const now = Date.now();
        
        // Check if expired
        if (now < expiryTime) {
          return true;
        } else {
          // Clear expired unlock
          localStorage.removeItem(UNLOCKED_KEY);
          localStorage.removeItem(UNLOCKED_EXPIRY_KEY);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      // Fallback to sessionStorage if localStorage is blocked
      try {
        const unlocked = sessionStorage.getItem(UNLOCKED_KEY);
        sessionStorage.removeItem(UNLOCKED_KEY); // Clear session-based unlock
        return unlocked === 'true';
      } catch {
        console.error('Storage access denied:', error);
        return false;
      }
    }
  }, [migrateOldUnlockState]);

  // Initialize unlock status on mount
  useEffect(() => {
    setIsUnlocked(checkUnlockStatus());
    setIsLoading(false);
  }, [checkUnlockStatus]);

  // Unlock function
  const unlock = useCallback((password: string): boolean => {
    const correctPassword = getPassword();
    
    // If no password is configured, allow access (fail-open)
    if (!correctPassword) {
      console.warn('Advanced features password not configured - allowing access without protection');
      return true;
    }

    // Validate password
    if (password !== correctPassword) {
      return false;
    }

    // Store unlock state with expiry
    try {
      const expiryTime = Date.now() + (EXPIRY_HOURS * 60 * 60 * 1000);
      localStorage.setItem(UNLOCKED_KEY, 'true');
      localStorage.setItem(UNLOCKED_EXPIRY_KEY, expiryTime.toString());
      setIsUnlocked(true);
      return true;
    } catch (error) {
      // Fallback to sessionStorage
      try {
        sessionStorage.setItem(UNLOCKED_KEY, 'true');
        setIsUnlocked(true);
        console.warn('Using sessionStorage fallback - unlock will last only this session');
        return true;
      } catch {
        console.error('Failed to store unlock state:', error);
        return false;
      }
    }
  }, []);

  // Lock function
  const lock = useCallback(() => {
    try {
      localStorage.removeItem(UNLOCKED_KEY);
      localStorage.removeItem(UNLOCKED_EXPIRY_KEY);
    } catch {
      try {
        sessionStorage.removeItem(UNLOCKED_KEY);
      } catch {
        // Ignore storage errors
      }
    }
    setIsUnlocked(false);
  }, []);

  return {
    isUnlocked,
    isLoading,
    unlock,
    lock,
  };
}
