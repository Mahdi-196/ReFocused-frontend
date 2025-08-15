interface CachedData<T> {
  data: T;
  date: string;
  timestamp: number;
}

interface DailyCacheConfig {
  keyPrefix: string;
  debugMode?: boolean;
}

class DailyCacheService {
  private debugMode: boolean;
  
  constructor(config: DailyCacheConfig = { keyPrefix: 'daily_cache' }) {
    this.debugMode = config.debugMode || false;
  }

  /**
   * Get today's date string in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get cache key for a specific type and date
   */
  private getCacheKey(type: string, date?: string): string {
    const targetDate = date || this.getTodayDate();
    return `ai_daily_${type}_${targetDate}`;
  }

  /**
   * Check if cached data exists and is still valid (same day)
   */
  has(type: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const cacheKey = this.getCacheKey(type);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      if (this.debugMode) console.log(`📦 No cache found for ${type}`);
      return false;
    }

    try {
      const parsedCache: CachedData<any> = JSON.parse(cached);
      const today = this.getTodayDate();
      
      if (parsedCache.date === today) {
        if (this.debugMode) console.log(`✅ Valid cache found for ${type} (${today})`);
        return true;
      } else {
        if (this.debugMode) console.log(`⏰ Cache expired for ${type} (cached: ${parsedCache.date}, today: ${today})`);
        // Remove expired cache
        localStorage.removeItem(cacheKey);
        return false;
      }
    } catch (error) {
      if (this.debugMode) console.error(`❌ Error parsing cache for ${type}:`, error);
      localStorage.removeItem(cacheKey);
      return false;
    }
  }

  /**
   * Get cached data if valid, null otherwise
   */
  get<T>(type: string): T | null {
    if (!this.has(type)) {
      return null;
    }

    const cacheKey = this.getCacheKey(type);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    try {
      const parsedCache: CachedData<T> = JSON.parse(cached);
      if (this.debugMode) console.log(`📖 Retrieved cached data for ${type}`, parsedCache.data);
      return parsedCache.data;
    } catch (error) {
      if (this.debugMode) console.error(`❌ Error retrieving cache for ${type}:`, error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }

  /**
   * Store data in cache with today's date
   */
  set<T>(type: string, data: T): void {
    if (typeof window === 'undefined') return;
    
    const today = this.getTodayDate();
    const cacheKey = this.getCacheKey(type);
    
    const cachedData: CachedData<T> = {
      data,
      date: today,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      if (this.debugMode) console.log(`💾 Cached data for ${type} (${today})`, data);
    } catch (error) {
      if (this.debugMode) console.error(`❌ Error caching data for ${type}:`, error);
      // If localStorage is full, try to clean up old cache first
      this.cleanup();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      } catch (retryError) {
        console.error('Failed to cache data even after cleanup:', retryError);
      }
    }
  }

  /**
   * Remove cached data for a specific type
   */
  remove(type: string): void {
    if (typeof window === 'undefined') return;
    
    const cacheKey = this.getCacheKey(type);
    localStorage.removeItem(cacheKey);
    if (this.debugMode) console.log(`🗑️ Removed cache for ${type}`);
  }

  /**
   * Clean up old cached data from previous days
   */
  cleanup(): void {
    if (typeof window === 'undefined') return;
    
    const today = this.getTodayDate();
    const keysToRemove: string[] = [];
    
    // Scan localStorage for old daily cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai_daily_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsedCache: CachedData<any> = JSON.parse(cached);
            if (parsedCache.date !== today) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If we can't parse it, it's probably corrupted, so remove it
          keysToRemove.push(key);
        }
      }
    }

    // Remove old cache entries
    keysToRemove.forEach(key => {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
      if (this.debugMode) console.log(`🧹 Cleaned up old cache: ${key}`);
    });

    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} old cache entries`);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { 
    totalCacheKeys: number; 
    todayCacheKeys: number; 
    oldCacheKeys: number;
    totalSize: number;
  } {
    if (typeof window === 'undefined') {
      return { totalCacheKeys: 0, todayCacheKeys: 0, oldCacheKeys: 0, totalSize: 0 };
    }
    
    const today = this.getTodayDate();
    let totalCacheKeys = 0;
    let todayCacheKeys = 0;
    let oldCacheKeys = 0;
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai_daily_')) {
        totalCacheKeys++;
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
        
        try {
          const cached: CachedData<any> = JSON.parse(value);
          if (cached.date === today) {
            todayCacheKeys++;
          } else {
            oldCacheKeys++;
          }
        } catch {
          oldCacheKeys++;
        }
      }
    }

    return { totalCacheKeys, todayCacheKeys, oldCacheKeys, totalSize };
  }

  /**
   * Force refresh - remove all cached data and clean up
   */
  forceRefresh(): void {
    const today = this.getTodayDate();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai_daily_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🔄 Force refreshed all daily cache (${keysToRemove.length} entries removed)`);
  }

  /**
   * Initialize daily cache - run cleanup on first load of the day
   */
  init(): void {
    if (typeof window === 'undefined') return;
    
    const lastCleanupKey = 'daily_cache_last_cleanup';
    const lastCleanup = localStorage.getItem(lastCleanupKey);
    const today = this.getTodayDate();

    if (!lastCleanup || lastCleanup !== today) {
      this.cleanup();
      localStorage.setItem(lastCleanupKey, today);
      console.log(`🚀 Daily cache initialized for ${today}`);
    }
  }
}

// Create singleton instance
export const dailyCache = new DailyCacheService({ 
  keyPrefix: 'ai_daily',
  debugMode: process.env.NODE_ENV === 'development' 
});

// Cache type constants
export const CACHE_TYPES = {
  QUOTE_OF_DAY: 'quote_of_day',
  WORD_OF_DAY: 'word_of_day', 
  MIND_FUEL: 'mind_fuel',
  AI_ASSISTANCE: 'ai_assistance',
  WRITING_PROMPTS: 'writing_prompts',
  WEEKLY_THEME: 'weekly_theme'
} as const;

export type CacheType = typeof CACHE_TYPES[keyof typeof CACHE_TYPES];