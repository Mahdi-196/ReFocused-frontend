'use client';

import React from 'react';
import { useConsoleControl } from '../hooks/useConsoleControl';

/**
 * Development-only component for managing console logging behavior
 * Provides visual feedback and controls for console override system
 */
interface ConsoleControlPanelProps {
  inline?: boolean;
}

const ConsoleControlPanel: React.FC<ConsoleControlPanelProps> = ({ inline = false }) => {
  const {
    isDevelopment,
    isInitialized,
    logsHidden,
    canForceEnable,
    forceEnable,
    restore,
    getStatus
  } = useConsoleControl();

  // Only show in development
  if (!isDevelopment) {
    return null;
  }

  const handleForceEnable = () => {
    forceEnable();
  };

  const handleRestore = () => {
    restore();
  };

  const handleRefreshStatus = () => {
    const status = getStatus();
    console.log('Console Override Status:', status);
  };

  const containerClass = inline
    ? 'bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700 max-w-sm'
    : 'fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700 max-w-sm z-50';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Console Control</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshStatus}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Environment:</span>
          <span className={isDevelopment ? 'text-green-400' : 'text-red-400'}>
            {isDevelopment ? 'Development' : 'Production'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Initialized:</span>
          <span className={isInitialized ? 'text-green-400' : 'text-yellow-400'}>
            {isInitialized ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Logs Hidden:</span>
          <span className={logsHidden ? 'text-red-400' : 'text-green-400'}>
            {logsHidden ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        {canForceEnable && (
          <button
            onClick={handleForceEnable}
            className="w-full px-3 py-2 text-xs bg-yellow-600 hover:bg-yellow-700 rounded"
          >
            Force Enable Logs
          </button>
        )}
        
        {isInitialized && (
          <button
            onClick={handleRestore}
            className="w-full px-3 py-2 text-xs bg-gray-600 hover:bg-gray-700 rounded"
          >
            Restore Console
          </button>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          {logsHidden 
            ? 'Console logs are currently hidden in production mode'
            : 'Console logs are visible in development mode'
          }
        </p>
      </div>
    </div>
  );
};

export default ConsoleControlPanel;
