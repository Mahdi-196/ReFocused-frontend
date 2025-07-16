'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface TokenExpiryNotificationProps {
  onRefresh?: () => void;
  onDismiss?: () => void;
}

export const TokenExpiryNotification: React.FC<TokenExpiryNotificationProps> = ({
  onRefresh,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleTokenWarning = (event: CustomEvent) => {
      console.log('📢 Token expiry warning received:', event.detail);
      setTimeLeft(event.detail.timeLeft);
      setMessage(event.detail.message);
      setIsVisible(true);
    };

    const handleUserLoggedOut = () => {
      setIsVisible(false);
    };

    // Listen for token expiry warnings
    window.addEventListener('tokenExpiryWarning', handleTokenWarning as EventListener);
    window.addEventListener('userLoggedOut', handleUserLoggedOut);

    return () => {
      window.removeEventListener('tokenExpiryWarning', handleTokenWarning as EventListener);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  const handleRefresh = () => {
    console.log('🔄 User requested session refresh');
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    console.log('❌ User dismissed token expiry warning');
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-yellow-900/95 to-orange-900/95 backdrop-blur-sm border border-yellow-600/50 rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-yellow-200 mb-1">
              Session Expiring Soon
            </h3>
            <p className="text-xs text-yellow-300 mb-3 leading-relaxed">
              Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}. 
              Please save your work and refresh to continue.
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-yellow-900 transition-all duration-200 transform hover:scale-105"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Session
              </button>
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-yellow-300 hover:text-yellow-200 text-xs font-medium transition-colors duration-200"
              >
                <X className="w-3 h-3" />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};