"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Timer } from 'lucide-react';

interface RateLimitEventDetail {
  retryAfter?: number;
  path?: string;
}

export default function RateLimitNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const detail = (e as CustomEvent<RateLimitEventDetail>).detail || {};
      const sec = typeof detail.retryAfter === 'number' && isFinite(detail.retryAfter)
        ? Math.max(0, Math.round(detail.retryAfter))
        : null;

      setRetryAfter(sec);
      setSecondsLeft(sec);
      setIsVisible(true);

      // Start countdown if we have a value
      if (sec && sec > 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setSecondsLeft(prev => {
            if (prev === null) return null;
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    window.addEventListener('rateLimit', handleRateLimit as EventListener);
    return () => {
      window.removeEventListener('rateLimit', handleRateLimit as EventListener);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  if (!isVisible) return null;

  const dismiss = () => {
    setIsVisible(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl shadow-2xl p-6 max-w-md mx-4 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Too many requests</h2>
          <p className="text-gray-300 text-sm">
            You’re sending requests too quickly. Please pause for a moment before trying again.
          </p>
        </div>

        {typeof secondsLeft === 'number' && secondsLeft > 0 && (
          <div className="flex items-center justify-center gap-2 text-amber-300 text-sm mb-4">
            <Timer className="w-4 h-4" />
            <span>Try again in {secondsLeft}s</span>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={dismiss}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-colors duration-200"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}


