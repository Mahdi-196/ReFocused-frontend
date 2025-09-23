import { useEffect, useState } from 'react';
import { dailyCache } from '../services/dailyCache';
// Cache management is now handled by API routes

interface CacheStats {
  totalCacheKeys: number;
  todayCacheKeys: number;
  oldCacheKeys: number;
  totalSize: number;
}

interface UseDailyCacheReturn {
  isInitialized: boolean;
  cacheStats: CacheStats | null;
  refreshCache: () => void;
  clearCache: () => void;
}

/**
 * Hook to manage daily cache initialization and provide cache utilities
 */
export const useDailyCache = (): UseDailyCacheReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  useEffect(() => {
    // Initialize cache when hook mounts
    const initializeCache = () => {
      try {
        dailyCache.init();
        setIsInitialized(true);
        setCacheStats(dailyCache.getStats());
        // Initialized
      } catch (error) {
        console.error('❌ Failed to initialize daily cache:', error);
        setIsInitialized(false);
      }
    };

    initializeCache();

    // Also react to backend-signaled day changes
    const handleDayChange = () => {
      try {
        dailyCache.init();
        setCacheStats(dailyCache.getStats());
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('dayChanged', handleDayChange as EventListener);
    }

    // Set up cache stats update interval (every 5 minutes)
    const interval = setInterval(() => {
      setCacheStats(dailyCache.getStats());
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('dayChanged', handleDayChange as EventListener);
      }
    };
  }, []);

  const refreshCache = () => {
    try {
      // Cache management is now handled by API routes
      setCacheStats(dailyCache.getStats());
      // Refreshed
    } catch (error) {
      console.error('❌ Failed to refresh cache:', error);
    }
  };

  const clearCache = () => {
    try {
      dailyCache.forceRefresh();
      setCacheStats(dailyCache.getStats());
      // Cleared
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  };

  return {
    isInitialized,
    cacheStats,
    refreshCache,
    clearCache
  };
};

/**
 * Hook to provide content refresh functions (now handled by API routes)
 */
export const useContentCache = () => {
  const [cacheStatus, setCacheStatus] = useState({
    quote: false,
    word: false,
    mindFuel: false
  });

  useEffect(() => {
    // Cache status checking is now handled by API routes
    // This hook is kept for backward compatibility
    setCacheStatus({
      quote: false,
      word: false,
      mindFuel: false
    });
  }, []);

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const refreshContent = {
    quote: async () => {
      return fetch(`${base}/v1/ai/quote-of-day`, { method: 'GET' }).then(res => res.json());
    },
    word: async () => {
      return fetch(`${base}/v1/ai/word-of-day`, { method: 'GET' }).then(res => res.json());
    },
    mindFuel: async () => {
      return fetch(`${base}/v1/ai/mind-fuel`, { method: 'GET' }).then(res => res.json());
    },
    all: async () => {
      await Promise.all([
        fetch(`${base}/v1/ai/quote-of-day`, { method: 'GET' }),
        fetch(`${base}/v1/ai/word-of-day`, { method: 'GET' }),
        fetch(`${base}/v1/ai/mind-fuel`, { method: 'GET' })
      ]);
    }
  };

  return {
    cacheStatus,
    refreshContent
  };
};