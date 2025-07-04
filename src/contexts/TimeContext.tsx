'use client';

/**
 * Time Context - React integration for the time service
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { timeService } from '@/services/timeService';
import type { BackendTimeResponse, WeekInfo, TimeServiceState } from '@/types/time';
import { useAuth } from './AuthContext';

interface TimeContextValue {
  // Time data
  timeData: BackendTimeResponse | null;
  loading: boolean;
  error: string | null;
  
  // Core functions
  getCurrentDate: () => string;
  getCurrentDateTime: () => string;
  getUserTimezone: () => string;
  isMockDate: () => boolean;
  
  // Advanced functions
  getDateRange: (filter: 'D' | 'W' | 'M') => { start: string; end: string };
  formatUserDate: (dateString: string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeDate: (dateString: string) => string;
  
  // Timezone management
  detectAndSetTimezone: () => Promise<boolean>;
  updateUserTimezone: (timezone: string) => Promise<boolean>;
  getAvailableTimezones: () => Promise<import('@/types/time').TimezoneInfo[]>;
  
  // Week info
  getWeekInfo: () => Promise<WeekInfo | null>;
  
  // Sync management
  syncTime: () => Promise<void>;
  checkSyncStatus: () => Promise<import('@/types/time').TimeSyncCheck | null>;
  
  // Mock date management (available to all users for testing)
  setMockDateTime: (isoDateTime: string | null) => Promise<void>;
  
  // Service state
  getServiceState: () => TimeServiceState;
}

const TimeContext = createContext<TimeContextValue | undefined>(undefined);

interface TimeProviderProps {
  children: React.ReactNode;
}

export const TimeProvider: React.FC<TimeProviderProps> = ({ children }) => {
  const [timeData, setTimeData] = useState<BackendTimeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get authentication status from AuthContext
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Initialize time service and set up listeners
  useEffect(() => {
    let mounted = true;
    
    // Wait for auth to finish loading before initializing time service
    if (authLoading) {
      return;
    }
    
    const initializeTimeService = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize with authentication status
        await timeService.initialize(isAuthenticated);
        
        // Only update state if component is still mounted
        if (mounted) {
          // Get initial time data
          const serviceState = timeService.getState();
          setTimeData(serviceState.currentTime);
        }
        
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize time service';
          setError(errorMessage);
          console.error('TimeProvider initialization error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeTimeService();

    // Listen for time updates (throttled)
    let updateTimeout: NodeJS.Timeout | null = null;
    const handleTimeUpdate = () => {
      if (updateTimeout) return; // Skip if already scheduled
      
      updateTimeout = setTimeout(() => {
        if (mounted) {
          const serviceState = timeService.getState();
          setTimeData(serviceState.currentTime);
          setError(null);
        }
        updateTimeout = null;
      }, 1000); // Throttle updates to once per second
    };

    timeService.addEventListener(handleTimeUpdate);

    // Listen for day changes
    const handleDayChange = (event: CustomEvent) => {
      console.log('📅 Day changed in TimeProvider:', event.detail);
      // Force update to reflect new day
      if (mounted) {
        handleTimeUpdate();
      }
    };

    window.addEventListener('dayChanged', handleDayChange as EventListener);

    // Cleanup
    return () => {
      mounted = false;
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      timeService.removeEventListener(handleTimeUpdate);
      window.removeEventListener('dayChanged', handleDayChange as EventListener);
    };
  }, [isAuthenticated, authLoading]); // Re-run when auth status changes

  // Update time service when authentication status changes
  useEffect(() => {
    if (!authLoading) {
      timeService.setAuthenticationStatus(isAuthenticated);
    }
  }, [isAuthenticated, authLoading]);

  // Core functions - with graceful fallbacks for unauthenticated state
  const getCurrentDate = useCallback((): string => {
    try {
      return timeService.getCurrentDate();
    } catch (error) {
      // If service isn't ready but we have cached data, use it
      if (timeData?.user_current_date) {
        return timeData.user_current_date;
      }
      // Fallback to local date if not authenticated
      if (!isAuthenticated) {
        return new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD format
      }
      // Re-throw the error if authenticated but service failed
      throw error;
    }
  }, [timeData, isAuthenticated]);

  const getCurrentDateTime = useCallback((): string => {
    try {
      return timeService.getCurrentDateTime();
    } catch (error) {
      if (timeData?.user_current_datetime) {
        return timeData.user_current_datetime;
      }
      // Fallback to local datetime if not authenticated
      if (!isAuthenticated) {
        return new Date().toISOString();
      }
      throw error;
    }
  }, [timeData, isAuthenticated]);

  const getUserTimezone = useCallback((): string => {
    try {
      return timeService.getUserTimezone();
    } catch (error) {
      if (timeData?.user_timezone) {
        return timeData.user_timezone;
      }
      // Fallback to local timezone if not authenticated
      if (!isAuthenticated) {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
      throw error;
    }
  }, [timeData, isAuthenticated]);

  const isMockDate = useCallback((): boolean => {
    try {
      return timeService.isMockDate();
    } catch (error) {
      if (timeData?.is_mock_date !== undefined) {
        return timeData.is_mock_date;
      }
      // Fallback - never mock when not authenticated
      if (!isAuthenticated) {
        return false;
      }
      throw error;
    }
  }, [timeData, isAuthenticated]);

  // Advanced functions
  const getDateRange = useCallback((filter: 'D' | 'W' | 'M') => {
    return timeService.getDateRange(filter);
  }, []);

  const formatUserDate = useCallback((dateString: string, options?: Intl.DateTimeFormatOptions): string => {
    return timeService.formatUserDate(dateString, options);
  }, []);

  const formatRelativeDate = useCallback((dateString: string): string => {
    return timeService.formatRelativeDate(dateString);
  }, []);

  // Timezone management - only available when authenticated
  const detectAndSetTimezone = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error('Timezone management requires authentication');
    }
    
    try {
      setLoading(true);
      const result = await timeService.detectAndSetTimezone();
      
      // Update state after timezone change
      const serviceState = timeService.getState();
      setTimeData(serviceState.currentTime);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect timezone';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateUserTimezone = useCallback(async (timezone: string): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error('Timezone management requires authentication');
    }
    
    try {
      setLoading(true);
      const result = await timeService.updateUserTimezone(timezone);
      
      // Update state after timezone change
      const serviceState = timeService.getState();
      setTimeData(serviceState.currentTime);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update timezone';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getAvailableTimezones = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Timezone management requires authentication');
    }
    return timeService.getAvailableTimezones();
  }, [isAuthenticated]);

  // Week info - only available when authenticated
  const getWeekInfo = useCallback(async (): Promise<WeekInfo | null> => {
    if (!isAuthenticated) {
      return null; // Gracefully return null instead of throwing
    }
    return timeService.getWeekInfo();
  }, [isAuthenticated]);

  // Sync management
  const syncTime = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      // Silently skip sync if not authenticated
      return;
    }
    
    try {
      await timeService.syncWithBackend();
      const serviceState = timeService.getState();
      setTimeData(serviceState.currentTime);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync time';
      setError(errorMessage);
      throw err;
    }
  }, [isAuthenticated]);

  const checkSyncStatus = useCallback(async () => {
    if (!isAuthenticated) {
      return null; // Gracefully return null instead of throwing
    }
    return timeService.checkSyncStatus();
  }, [isAuthenticated]);

  const getServiceState = useCallback((): TimeServiceState => {
    return timeService.getState();
  }, []);

  // Mock date management - available to all users for testing
  const setMockDateTime = useCallback(async (isoDateTime: string | null): Promise<void> => {
    try {
      setLoading(true);
      console.log('🔄 TimeContext: Setting mock date...', isoDateTime);
      
      await timeService.setMockDateTime(isoDateTime);
      
      // Add a small delay to ensure backend has processed the request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force multiple syncs to ensure we get the updated data
      console.log('🔄 TimeContext: Forcing fresh sync (attempt 1)...');
      await timeService.syncWithBackend();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('🔄 TimeContext: Forcing fresh sync (attempt 2)...');
      await timeService.syncWithBackend();
      
      // Update state after mock date change
      const serviceState = timeService.getState();
      console.log('🔍 TimeContext: New service state:', serviceState.currentTime);
      
      setTimeData(serviceState.currentTime);
      setError(null);
      
      // Force a complete re-render by updating the timeData reference
      setTimeData(prevData => ({
        ...serviceState.currentTime!
      }));
      
      console.log('✅ TimeContext: Mock date operation completed');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set mock date';
      console.error('❌ TimeContext: Mock date error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: TimeContextValue = {
    timeData,
    loading,
    error,
    getCurrentDate,
    getCurrentDateTime,
    getUserTimezone,
    isMockDate,
    getDateRange,
    formatUserDate,
    formatRelativeDate,
    detectAndSetTimezone,
    updateUserTimezone,
    getAvailableTimezones,
    getWeekInfo,
    syncTime,
    checkSyncStatus,
    setMockDateTime,
    getServiceState,
  };

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
};

/**
 * Hook for using time data and functions
 */
export const useTime = (): TimeContextValue => {
  const context = useContext(TimeContext);
  
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  
  return context;
};

/**
 * Hook for getting just the current date (most common use case)
 */
export const useCurrentDate = (): string => {
  const { timeData, loading, getCurrentDate } = useTime();
  
  try {
    // If we have timeData available, use it directly
    if (timeData?.user_current_date) {
      return timeData.user_current_date;
    }
    
    // If still loading, return a reasonable fallback
    if (loading) {
      return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // Try the service as last resort
    try {
      return getCurrentDate();
    } catch (error) {
      console.warn('Time service not ready, using local date fallback');
      return new Date().toISOString().split('T')[0];
    }
  } catch (error) {
    // Ultimate fallback if everything fails
    console.warn('useCurrentDate hook error, using system date:', error);
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Hook for date formatting functions
 */
export const useDateFormatting = () => {
  const { formatUserDate, formatRelativeDate, getUserTimezone } = useTime();
  
  return {
    formatUserDate,
    formatRelativeDate,
    getUserTimezone
  };
};

/**
 * Hook for timezone management
 */
export const useTimezone = () => {
  const { 
    getUserTimezone, 
    detectAndSetTimezone, 
    updateUserTimezone, 
    getAvailableTimezones 
  } = useTime();
  
  return {
    getUserTimezone,
    detectAndSetTimezone,
    updateUserTimezone,
    getAvailableTimezones
  };
}; 