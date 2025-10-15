"use client";

import React, { createContext, useContext } from 'react';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import NetworkDisconnectWarning from './NetworkDisconnectWarning';

interface NetworkContextType {
  isConnected: boolean;
  showDisconnectWarning: boolean;
  consecutiveFailures: number;
  forceCheck: () => void;
  dismissWarning: () => void;
  markNetworkFailure: () => void;
  markNetworkSuccess: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const networkMonitor = useNetworkMonitor({
    failureThreshold: 10,
    retryDelay: 10000, // Check every 10 seconds when disconnected
    enableAutoCheck: true
  });

  const handleRefresh = () => {
    networkMonitor.forceCheck();
    window.location.reload();
  };

  return (
    <NetworkContext.Provider value={networkMonitor}>
      {children}
      <NetworkDisconnectWarning
        isVisible={networkMonitor.showDisconnectWarning}
        onRefresh={handleRefresh}
      />
    </NetworkContext.Provider>
  );
};

export default NetworkProvider;