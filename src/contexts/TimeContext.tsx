'use client';

/**
 * Time Context - React integration for the time service
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { timeService } from '@/services/timeService';
import type { BackendTimeResponse, WeekInfo, TimeServiceState } from '@/types/time';

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

  // Initialize time service and set up listeners
  useEffect(() => {
    let mounted = true;
    
    const initializeTimeService = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await timeService.initialize();
        
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
  }, []);

  // Core functions - no fallbacks, let errors propagate
  const getCurrentDate = useCallback((): string => {
    try {
      return timeService.getCurrentDate();
    } catch (error) {
      // If service isn't ready but we have cached data, use it
      if (timeData?.user_current_date) {
        return timeData.user_current_date;
      }
      // Re-throw the error if no cached data available
      throw error;
    }
  }, [timeData]);

  const getCurrentDateTime = useCallback((): string => {
    try {
      return timeService.getCurrentDateTime();
    } catch (error) {
      if (timeData?.user_current_datetime) {
        return timeData.user_current_datetime;
      }
      throw error;
    }
  }, [timeData]);

  const getUserTimezone = useCallback((): string => {
    try {
      return timeService.getUserTimezone();
    } catch (error) {
      if (timeData?.user_timezone) {
        return timeData.user_timezone;
      }
      throw error;
    }
  }, [timeData]);

  const isMockDate = useCallback((): boolean => {
    try {
      return timeService.isMockDate();
    } catch (error) {
      if (timeData?.is_mock_date !== undefined) {
        return timeData.is_mock_date;
      }
      throw error;
    }
  }, [timeData]);

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

  // Timezone management
  const detectAndSetTimezone = useCallback(async (): Promise<boolean> => {
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
      console.error('Error detecting timezone:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserTimezone = useCallback(async (timezone: string): Promise<boolean> => {
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
      console.error('Error updating timezone:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableTimezones = useCallback(async () => {
    return await timeService.getAvailableTimezones();
  }, []);

  // Week info
  const getWeekInfo = useCallback(async (): Promise<WeekInfo | null> => {
    return await timeService.getWeekInfo();
  }, []);

  // Sync management
  const syncTime = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await timeService.syncWithBackend();
      
      // Update state after sync
      const serviceState = timeService.getState();
      setTimeData(serviceState.currentTime);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync time';
      setError(errorMessage);
      console.error('Error syncing time:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSyncStatus = useCallback(async () => {
    try {
      return await timeService.checkSyncStatus();
    } catch (err) {
      console.error('Error checking sync status:', err);
      return null;
    }
  }, []);

  const getServiceState = useCallback((): TimeServiceState => {
    try {
      return timeService.getState();
    } catch (err) {
      console.error('Error getting service state:', err);
      return {
        currentTime: null,
        lastSync: null,
        isOnline: navigator.onLine,
        syncInProgress: false,
        syncErrors: 0
      };
    }
  }, []);

  const contextValue: TimeContextValue = {
    // Time data
    timeData,
    loading,
    error,
    
    // Core functions
    getCurrentDate,
    getCurrentDateTime,
    getUserTimezone,
    isMockDate,
    
    // Advanced functions
    getDateRange,
    formatUserDate,
    formatRelativeDate,
    
    // Timezone management
    detectAndSetTimezone,
    updateUserTimezone,
    getAvailableTimezones,
    
    // Week info
    getWeekInfo,
    
    // Sync management
    syncTime,
    checkSyncStatus,
    
    // Service state
    getServiceState
  };

  return (
    <TimeContext.Provider value={contextValue}>
      {children}
    </TimeContext.Provider>
  );
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
  try {
    const { timeData, loading, getCurrentDate } = useTime();
    
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