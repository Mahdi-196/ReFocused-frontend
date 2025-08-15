import { useState, useEffect, useCallback } from 'react';
import { apiService, type QuoteResponse, type WordResponse, type MindFuelResponse } from '../services/api';

type ContentType = 'quote' | 'word' | 'mindFuel';

interface CachedContent<T> {
  data: T;
  date: string;
  timestamp: number;
}

interface UseDailyContentReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isCached: boolean;
}

/**
 * Smart daily content hook that:
 * 1. Caches content for the current day
 * 2. Automatically refreshes at midnight
 * 3. Only fetches from backend once per day
 * 4. Provides manual refresh capability
 */
function useDailyContent<T>(
  contentType: ContentType,
  fetchFunction: () => Promise<T>
): UseDailyContentReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const getStorageKey = () => `daily_content_${contentType}`;
  const getTodayString = () => new Date().toDateString();

  /**
   * Check if cached content is still valid (same day)
   */
  const isCacheValid = (cached: CachedContent<T>): boolean => {
    const today = getTodayString();
    return cached.date === today;
  };

  /**
   * Load content from localStorage cache
   */
  const loadFromCache = (): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(getStorageKey());
      if (cached) {
        const parsedCache: CachedContent<T> = JSON.parse(cached);
        if (isCacheValid(parsedCache)) {
          if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            console.log(`📋 Loading ${contentType} from cache`);
          }
          setIsCached(true);
          return parsedCache.data;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(getStorageKey());
          if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            console.log(`🗑️ Expired cache removed for ${contentType}`);
          }
        }
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.error(`❌ Error loading ${contentType} from cache:`, error);
      }
      localStorage.removeItem(getStorageKey());
    }
    
    return null;
  };

  /**
   * Save content to localStorage cache
   */
  const saveToCache = useCallback((content: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: CachedContent<T> = {
        data: content,
        date: getTodayString(),
        timestamp: Date.now()
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(cacheData));
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log(`💾 Cached ${contentType} for today`);
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.error(`❌ Error saving ${contentType} to cache:`, error);
      }
    }
  }, [contentType]);

  /**
   * Fetch fresh content from API
   */
  const fetchFreshContent = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setIsCached(false);
    
    try {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log(`📡 Fetching fresh ${contentType} from API`);
      }
      const freshData = await fetchFunction();
      
      // Save to cache
      saveToCache(freshData);
      
      return freshData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${contentType}`;
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.error(`❌ Error fetching ${contentType}:`, err);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [contentType, fetchFunction, saveToCache]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async (): Promise<void> => {
    const freshData = await fetchFreshContent();
    if (freshData) {
      setData(freshData);
    }
  }, [fetchFreshContent]);

  /**
   * Load content (cache-first, then API if needed)
   */
  const loadContent = useCallback(async (): Promise<void> => {
    // Try cache first
    const cachedData = loadFromCache();
    if (cachedData) {
      setData(cachedData);
      return;
    }

    // Cache miss or expired - fetch from API
    const freshData = await fetchFreshContent();
    if (freshData) {
      setData(freshData);
    }
  }, [fetchFreshContent]);

  /**
   * Set up midnight refresh timer
   */
  const setupMidnightRefresh = useCallback((): (() => void) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 100); // 100ms after midnight to ensure day change
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log(`⏰ ${contentType} will auto-refresh in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
    }
    
    const timeoutId = setTimeout(() => {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log(`🌅 Midnight refresh triggered for ${contentType}`);
      }
      refresh();
      
      // Set up daily recurring refresh
      const intervalId = setInterval(refresh, 24 * 60 * 60 * 1000); // Every 24 hours
      
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, [refresh]);

  // Initialize content on mount
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Set up automatic midnight refresh
  useEffect(() => {
    const cleanup = setupMidnightRefresh();
    return cleanup;
  }, [setupMidnightRefresh]);

  // Clear error when content type changes
  useEffect(() => {
    setError(null);
  }, [contentType]);

  return {
    data,
    loading,
    error,
    refresh,
    isCached
  };
}

/**
 * Hook for Quote of the Day with smart caching
 */
export const useQuoteOfTheDay = () => {
  const fetchQuote = useCallback(async () => {
    throw new Error('Quote of the Day is disabled in production.');
  }, []);
  
  return useDailyContent<QuoteResponse>('quote', fetchQuote);
};

/**
 * Hook for Word of the Day with smart caching
 */
export const useWordOfTheDay = () => {
  const fetchWord = useCallback(async () => {
    throw new Error('Word of the Day is disabled in production.');
  }, []);
  
  return useDailyContent<WordResponse>('word', fetchWord);
};

/**
 * Hook for Mind Fuel with smart caching
 */
export const useMindFuel = () => {
  const fetchMindFuel = useCallback(async () => {
    throw new Error('Mind Fuel is disabled in production.');
  }, []);
  
  return useDailyContent<MindFuelResponse>('mindFuel', fetchMindFuel);
};

/**
 * Utility to clear all daily content caches
 */
export const clearAllDailyCache = (): void => {
  if (typeof window === 'undefined') return;
  
  const keys = ['daily_content_quote', 'daily_content_word', 'daily_content_mindFuel'];
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    console.log('🧹 Cleared all daily content cache');
  }
};

/**
 * Utility to get cache stats
 */
export const getDailyCacheStats = () => {
  if (typeof window === 'undefined') return null;
  
  const keys = ['daily_content_quote', 'daily_content_word', 'daily_content_mindFuel'];
  const stats = keys.map(key => {
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed: CachedContent<any> = JSON.parse(cached);
        return {
          type: key.replace('daily_content_', ''),
          date: parsed.date,
          age: Math.round((Date.now() - parsed.timestamp) / 1000 / 60), // age in minutes
          valid: parsed.date === new Date().toDateString()
        };
      } catch {
        return null;
      }
    }
    return null;
  }).filter(Boolean);
  
  return stats;
};