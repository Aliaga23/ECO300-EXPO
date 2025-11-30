import { useState, useEffect, useCallback } from 'react';

interface UseAIUnlockReturn {
  isUnlocked: boolean;
  isLoading: boolean;
  unlock: (password: string) => boolean;
  lock: () => void;
}

// Constants for localStorage keys and expiry time
const UNLOCKED_KEY = 'elasticbot_ai_unlocked';
const UNLOCKED_EXPIRY_KEY = 'elasticbot_ai_unlocked_expiry';
const EXPIRY_HOURS = 24;

export function useAIUnlock(): UseAIUnlockReturn {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get password from environment variables
  const getPassword = (): string | null => {
    const password = import.meta.env.VITE_AI_PASSWORD;
    
    // Log warning in development if password is not set
    if (!password && import.meta.env.DEV) {
      console.warn('⚠️ VITE_AI_PASSWORD is not set. AI feature will be accessible without password protection.');
    }
    
    return password || null;
  };

  // Check if current unlock is still valid
  const checkUnlockStatus = useCallback(() => {
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
        const unlocked = sessionStorage.getItem(UNLOCKED_KEY) === 'true';
        sessionStorage.removeItem(UNLOCKED_KEY); // Clear session-based unlock
        return unlocked;
      } catch {
        console.error('Storage access denied:', error);
        return false;
      }
    }
  }, []);

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
      console.warn('AI password not configured - allowing access without protection');
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
