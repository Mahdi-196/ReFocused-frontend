"use client";

import { useState, useEffect, useCallback } from 'react';

interface NetworkMonitorConfig {
  // How many consecutive failures before showing disconnect warning
  failureThreshold?: number;
  // How long to wait before checking network again (ms)
  retryDelay?: number;
  // Enable automatic network status checking
  enableAutoCheck?: boolean;
}

interface NetworkMonitorReturn {
  isConnected: boolean;
  showDisconnectWarning: boolean;
  consecutiveFailures: number;
  forceCheck: () => void;
  dismissWarning: () => void;
  markNetworkFailure: () => void;
  markNetworkSuccess: () => void;
}

export const useNetworkMonitor = (config: NetworkMonitorConfig = {}): NetworkMonitorReturn => {
  const {
    failureThreshold = 3,
    retryDelay = 5000,
    enableAutoCheck = true
  } = config;

  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  // Check network connectivity by trying to fetch a small resource
  const checkNetworkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource from the same domain
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      return false;
    }
  }, []);

  // Force a network check
  const forceCheck = useCallback(async () => {
    const isOnline = await checkNetworkConnectivity();
    setIsConnected(isOnline);
    setLastCheckTime(Date.now());

    if (isOnline) {
      setConsecutiveFailures(0);
      setShowDisconnectWarning(false);
    } else {
      setConsecutiveFailures(prev => prev + 1);
    }
  }, [checkNetworkConnectivity]);

  // Mark a network failure (called by other parts of the app)
  const markNetworkFailure = useCallback(() => {
    setConsecutiveFailures(prev => {
      const newCount = prev + 1;
      if (newCount >= failureThreshold) {
        setShowDisconnectWarning(true);
      }
      return newCount;
    });
  }, [failureThreshold]);

  // Mark a network success (called by other parts of the app)
  const markNetworkSuccess = useCallback(() => {
    setConsecutiveFailures(0);
    setShowDisconnectWarning(false);
    setIsConnected(true);
  }, []);

  // Dismiss the warning manually
  const dismissWarning = useCallback(() => {
    setShowDisconnectWarning(false);
  }, []);

  // Listen for browser online/offline events and custom network events
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      setConsecutiveFailures(0);
      setShowDisconnectWarning(false);
    };

    const handleOffline = () => {
      setIsConnected(false);
      setShowDisconnectWarning(true);
    };

    const handleNetworkFailure = () => {
      markNetworkFailure();
    };

    const handleNetworkSuccess = () => {
      markNetworkSuccess();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('networkFailure', handleNetworkFailure);
    window.addEventListener('networkSuccess', handleNetworkSuccess);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('networkFailure', handleNetworkFailure);
      window.removeEventListener('networkSuccess', handleNetworkSuccess);
    };
  }, [markNetworkFailure, markNetworkSuccess]);

  // Auto-check network periodically when failures are detected
  useEffect(() => {
    if (!enableAutoCheck || consecutiveFailures === 0) return;

    const interval = setInterval(() => {
      forceCheck();
    }, retryDelay);

    return () => clearInterval(interval);
  }, [consecutiveFailures, enableAutoCheck, retryDelay, forceCheck]);

  // Show warning when failure threshold is reached
  useEffect(() => {
    if (consecutiveFailures >= failureThreshold) {
      setShowDisconnectWarning(true);
    }
  }, [consecutiveFailures, failureThreshold]);

  return {
    isConnected,
    showDisconnectWarning,
    consecutiveFailures,
    forceCheck,
    dismissWarning,
    markNetworkFailure,
    markNetworkSuccess
  };
};

export default useNetworkMonitor;