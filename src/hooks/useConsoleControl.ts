'use client';

import { useEffect, useState, useCallback } from 'react';
import { consoleOverride } from '../utils/consoleOverride';
import { logger } from '../utils/logger';
import { isDevelopment, isProduction } from '../config/environment';

interface ConsoleControlState {
  isDevelopment: boolean;
  isInitialized: boolean;
  logsHidden: boolean;
  canForceEnable: boolean;
}

/**
 * React hook for managing console logging behavior
 * Provides controls for enabling/disabling console logs and checking status
 */
export const useConsoleControl = () => {
  const [state, setState] = useState<ConsoleControlState>(() => ({
    isDevelopment: isDevelopment,
    isInitialized: false,
    logsHidden: false,
    canForceEnable: false
  }));

  // Update state when console override status changes
  const updateStatus = useCallback(() => {
    const status = consoleOverride.getStatus();
    const loggerStatus = logger.getStatus();
    
    setState({
      isDevelopment: status.isDevelopment,
      isInitialized: status.isInitialized,
      logsHidden: status.logsHidden,
      canForceEnable: !status.isDevelopment && status.isInitialized
    });
  }, []);

  // Initialize console override
  const initialize = useCallback(() => {
    consoleOverride.init();
    updateStatus();
  }, [updateStatus]);

  // Force enable console logs (useful for debugging in production)
  const forceEnable = useCallback(() => {
    consoleOverride.forceEnable();
    updateStatus();
  }, [updateStatus]);

  // Restore original console methods
  const restore = useCallback(() => {
    consoleOverride.restore();
    updateStatus();
  }, [updateStatus]);

  // Get current console status
  const getStatus = useCallback(() => {
    return consoleOverride.getStatus();
  }, []);

  // Check if we're in development mode
  const isDevelopmentCheck = useCallback(() => {
    return isDevelopment;
  }, []);

  // Check if we're in production mode
  const isProductionCheck = useCallback(() => {
    return isProduction;
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
    
    // Update status periodically to catch any external changes
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, [initialize, updateStatus]);

  return {
    // State
    ...state,
    
    // Actions
    initialize,
    forceEnable,
    restore,
    getStatus,
    
    // Environment checks
    isDevelopmentCheck,
    isProductionCheck,
    
    // Utility functions
    shouldLog: (level: 'log' | 'info' | 'debug' | 'warn' | 'error') => {
      if (level === 'warn' || level === 'error') return true;
      return state.isDevelopment;
    }
  };
};

export default useConsoleControl;
