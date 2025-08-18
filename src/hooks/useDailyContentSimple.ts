import { useState, useEffect } from 'react';
import { type QuoteResponse, type WordResponse, type MindFuelResponse, type AiSuggestionsResponse, type WritingPromptsResponse } from '../services/api';

type ContentType = 'quote' | 'word' | 'mindFuel' | 'aiAssist' | 'writingPrompts' | 'weeklyTheme';

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
 * Simple daily content hook with localStorage caching
 */
export function useDailyContentSimple<T>(
  contentType: ContentType,
  apiEndpoint: string,
  options?: { method?: 'GET' | 'POST'; body?: any; auth?: 'auto' | 'omit' | 'required' }
): UseDailyContentReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const storageKey = `daily_content_${contentType}`;
  const todayString = new Date().toDateString();

  // Check if cached content is valid
  const isCacheValid = (cached: CachedContent<T>): boolean => {
    return cached.date === todayString;
  };

  // Load from cache
  const loadFromCache = (): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsedCache: CachedContent<T> = JSON.parse(cached);
        if (isCacheValid(parsedCache)) {
          if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            console.log(`📋 Loading ${contentType} from cache`);
          }
          return parsedCache.data;
        } else {
          localStorage.removeItem(storageKey);
          if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            console.log(`🗑️ Expired cache removed for ${contentType}`);
          }
        }
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.error(`❌ Error loading ${contentType} from cache:`, error);
      }
      localStorage.removeItem(storageKey);
    }
    
    return null;
  };

  // Save to cache
  const saveToCache = (content: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: CachedContent<T> = {
        data: content,
        date: todayString,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(cacheData));
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log(`💾 Cached ${contentType} for today`);
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.error(`❌ Error saving ${contentType} to cache:`, error);
      }
    }
  };

  // Fetch from API
  const fetchFromApi = async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setIsCached(false);
    
    try {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log(`📡 Fetching fresh ${contentType} from API`);
      }
      
      // Determine auth token behavior
      const wantsAuth = options?.auth !== 'omit';
      let token: string | null = null;
      if (wantsAuth) {
        token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
      }
      
      const method = options?.method || 'GET';
      const fetchInit: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      };
      if (method === 'POST') {
        fetchInit.body = options?.body ? JSON.stringify(options.body) : undefined;
      }

      const response = await fetch(apiEndpoint, fetchInit);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const freshData = await response.json();
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
  };

  // Load content (cache-first)
  const loadContent = async (): Promise<void> => {
    // Try cache first
    const cachedData = loadFromCache();
    if (cachedData) {
      setData(cachedData);
      setIsCached(true);
      return;
    }

    // Cache miss - fetch from API
    const freshData = await fetchFromApi();
    if (freshData) {
      setData(freshData);
    }
  };

  // Refresh function
  const refresh = async (): Promise<void> => {
    const freshData = await fetchFromApi();
    if (freshData) {
      setData(freshData);
    }
  };

  // Setup midnight refresh
  const setupMidnightRefresh = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 100); // 100ms after midnight
    
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
      const intervalId = setInterval(refresh, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => clearTimeout(timeoutId);
  };

  // Initialize on mount
  useEffect(() => {
    loadContent();
    const cleanup = setupMidnightRefresh();
    return cleanup;
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    isCached
  };
}

// Specific hooks for each content type
export const useQuoteOfTheDaySimple = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  return useDailyContentSimple<QuoteResponse>('quote', `${base}/ai/quote-of-day`, { method: 'GET' });
};

export const useWordOfTheDaySimple = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  return useDailyContentSimple<WordResponse>('word', `${base}/ai/word-of-day`, { method: 'GET' });
};

export const useMindFuelSimple = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  return useDailyContentSimple<MindFuelResponse>('mindFuel', `${base}/ai/mind-fuel`, { method: 'GET' });
};

// Daily AI Assistance suggestions (cache per day)
export const useAiAssistanceDaily = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  return useDailyContentSimple<AiSuggestionsResponse>('aiAssist', `${base}/ai/ai-suggestions`, { method: 'POST' });
};

// Daily Writing Prompts (cache per day)
export const useWritingPromptsDaily = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  return useDailyContentSimple<WritingPromptsResponse>('writingPrompts', `${base}/ai/writing-prompts`, { method: 'POST' });
};

// Weekly Theme (cache per day)
export const useWeeklyTheme = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  return useDailyContentSimple<any>('weeklyTheme', `${base}/ai/weekly-theme`, { method: 'POST', auth: 'required' });
};