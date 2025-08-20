'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface TokenExpiryNotificationProps {
  onRefresh?: () => void;
  onDismiss?: () => void;
}

export const TokenExpiryNotification: React.FC<TokenExpiryNotificationProps> = ({ onRefresh, onDismiss }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);

  useEffect(() => {
    const handler = ((event: CustomEvent) => {
      const detail = (event as CustomEvent).detail as { timeLeft?: number } | undefined;
      setTimeLeftSec(typeof detail?.timeLeft === 'number' ? detail.timeLeft : null);
      setIsOpen(true);
    }) as EventListener;

    window.addEventListener('tokenNearExpiry', handler);
    return () => window.removeEventListener('tokenNearExpiry', handler);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  }, [onRefresh]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] max-w-sm w-[90vw] sm:w-[28rem]">
      <div className="flex items-start gap-3 p-4 rounded-lg shadow-lg bg-yellow-500 text-gray-900 border border-yellow-400/60">
        <AlertCircle className="w-5 h-5 mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="font-semibold">Session expiring soon</div>
          <div className="opacity-90">
            {typeof timeLeftSec === 'number' ? `Your session will expire in ${Math.max(0, Math.floor(timeLeftSec))}s.` : 'Please refresh to continue your session.'}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          aria-label="Refresh session"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={handleDismiss}
          className="ml-1 text-gray-900/70 hover:text-gray-900"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};