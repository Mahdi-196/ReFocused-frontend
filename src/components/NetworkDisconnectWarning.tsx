"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Mail } from 'lucide-react';

interface NetworkDisconnectWarningProps {
  isVisible: boolean;
  onRefresh?: () => void;
}

export const NetworkDisconnectWarning: React.FC<NetworkDisconnectWarningProps> = ({
  isVisible,
  onRefresh
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
        {/* Warning Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            You are disconnected
          </h2>
          
          {/* Message */}
          <p className="text-gray-300 leading-relaxed">
            Please try refreshing or contact support. Sorry for the wait.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Page
          </button>
          
          <div
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-800 text-gray-200 rounded-xl font-medium select-text"
          >
            <Mail className="w-5 h-5" />
            <span className="font-mono">support@refocused.app</span>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-gray-500 mt-6">
          Contact us if this lasts longer than 5 minutes
        </p>
      </div>
    </div>
  );
};

export default NetworkDisconnectWarning;