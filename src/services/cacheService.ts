import logger from '@/utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: string;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  enablePersistence: boolean;
}

interface CacheInvalidationOptions {
  pattern?: string;
  version?: string;
  force?: boolean;
}

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes default
    maxSize: 200, // Increased cache size
    enablePersistence: true
  };
  private persistenceKey = 'REF_CACHE_STORAGE';

  constructor() {
    this.loadFromPersistence();
    this.setupPeriodicCleanup();
  }

  // Enhanced set with versioning support
  set<T>(key: string, data: T, ttl?: number, version?: string): void {
    this.cleanupIfNeeded();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      version: version || this.generateVersion()
    };

    this.cache.set(key, entry);
    this.persistToDisk();
  }

  // Enhanced get with version checking
  get<T>(key: string, requiredVersion?: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check version mismatch
    if (requiredVersion && entry.version !== requiredVersion) {
      this.cache.delete(key);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.persistToDisk();
      return null;
    }

    return entry.data as T;
  }

  // Enhanced has with version support
  has(key: string, requiredVersion?: string): boolean {
    return this.get(key, requiredVersion) !== null;
  }

  // Remove specific key from cache
  delete(key: string): void {
    if (this.cache.delete(key)) {
      this.persistToDisk();
    }
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
    this.persistToDisk();
  }

  // Enhanced invalidation with multiple strategies
  invalidate(key: string, options?: CacheInvalidationOptions): void {
    if (options?.pattern) {
      this.invalidateByPattern(options.pattern);
    } else if (options?.version) {
      this.invalidateByVersion(options.version);
    } else {
      this.delete(key);
    }
  }

  // Invalidate cache entries by pattern
  invalidateByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern) || new RegExp(pattern).test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.persistToDisk();
    }
  }

  // Invalidate by version
  private invalidateByVersion(version: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.version === version) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.persistToDisk();
    }
  }

  // Clean up expired entries and size limits
  private cleanupIfNeeded(): void {
    // Remove expired entries first
    this.cleanup();
    
    // If still over size limit, remove oldest entries
    if (this.cache.size >= this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.config.maxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Remove expired entries
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.persistToDisk();
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const expired = entries.filter(([, entry]) => 
      now - entry.timestamp > entry.ttl
    ).length;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      expired,
      hitRate: this.calculateHitRate(),
      entries: entries.map(([key, entry]) => ({
        key,
        age: now - entry.timestamp,
        ttl: entry.ttl,
        version: entry.version
      }))
    };
  }

  // Calculate cache hit rate (simplified)
  private calculateHitRate(): number {
    // This would require more sophisticated tracking in a real implementation
    return Math.round((this.cache.size / this.config.maxSize) * 100);
  }

  // Generate version string
  private generateVersion(): string {
    return `v${Date.now()}`;
  }

  // Load cache from localStorage
  private loadFromPersistence(): void {
    if (!this.config.enablePersistence || typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        const parsedData = JSON.parse(stored);
        this.cache = new Map(parsedData);
        // Clean up expired entries on load
        this.cleanup();
      }
    } catch (error) {
      logger.warn('Failed to load cache from persistence', error, 'CACHE');
    }
  }

  // Persist cache to localStorage
  private persistToDisk(): void {
    if (!this.config.enablePersistence || typeof window === 'undefined') {
      return;
    }

    try {
      const serializable = Array.from(this.cache.entries());
      localStorage.setItem(this.persistenceKey, JSON.stringify(serializable));
    } catch (error) {
      logger.warn('Failed to persist cache to disk', error, 'CACHE');
    }
  }

  // Setup periodic cleanup
  private setupPeriodicCleanup(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanup();
      }, 60000); // Cleanup every minute
    }
  }

  // Singleton instance
  private static instance: CacheService;
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
}

// Create singleton instance
export const cacheService = CacheService.getInstance();

// Enhanced cache key generators with versioning
export const CacheKeys = {
  // User-specific keys
  USER_PROFILE: (userId?: string) => `user_profile_${userId || 'current'}`,
  USER_STATS: (userId?: string) => `user_stats_${userId || 'current'}`,
  
  // Study-related keys
  STUDY_SETS: (userId?: string) => `study_sets_${userId || 'current'}`,
  STUDY_SET_DETAIL: (setId: string) => `study_set_${setId}`,
  
  // Statistics keys with time-based versioning
  STATISTICS_DAILY: (date: string, userId?: string) => 
    `stats_daily_${date}_${userId || 'current'}`,
  STATISTICS_WEEKLY: (weekStart: string, userId?: string) => 
    `stats_weekly_${weekStart}_${userId || 'current'}`,
  STATISTICS_MONTHLY: (month: string, userId?: string) => 
    `stats_monthly_${month}_${userId || 'current'}`,
  
  // Mood tracking
  MOOD_ENTRIES: (startDate: string, endDate: string, userId?: string) => 
    `mood_entries_${startDate}_${endDate}_${userId || 'current'}`,
  MOOD_BY_DATE: (date: string, userId?: string) => 
    `mood_by_date_${date}_${userId || 'current'}`,
  
  // Habits
  HABITS: (userId?: string) => `habits_${userId || 'current'}`,
  HABIT_STREAKS: (habitId: string, userId?: string) => 
    `habit_streaks_${habitId}_${userId || 'current'}`,
  
  // Dashboard data
  DAILY_ENTRIES: (month: string, userId?: string) => 
    `daily_entries_${month}_${userId || 'current'}`,
};

// Cache TTL constants with better categorization
export const CacheTTL = {
  // Real-time data (frequently changing)
  REAL_TIME: 30 * 1000,      // 30 seconds
  SHORT: 2 * 60 * 1000,      // 2 minutes
  
  // Semi-static data (moderate changes)
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  STANDARD: 10 * 60 * 1000,  // 10 minutes
  
  // Static data (rarely changes)
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  
  // Session-based data
  SESSION: 8 * 60 * 60 * 1000, // 8 hours
  
  // User preferences (very stable)
  PERSISTENT: 24 * 60 * 60 * 1000 // 24 hours
};

// Cache invalidation helpers
export const CacheInvalidation = {
  // Invalidate all user-specific data
  invalidateUserData: (userId?: string) => {
    const pattern = userId || 'current';
    cacheService.invalidateByPattern(pattern);
  },
  
  // Invalidate study-related data
  invalidateStudyData: (userId?: string) => {
    cacheService.invalidateByPattern(`study_.*_${userId || 'current'}`);
  },
  
  // Invalidate statistics data
  invalidateStatistics: (userId?: string) => {
    cacheService.invalidateByPattern(`stats_.*_${userId || 'current'}`);
  },
  
  // Invalidate mood data
  invalidateMoodData: (userId?: string) => {
    cacheService.invalidateByPattern(`mood_.*_${userId || 'current'}`);
  },
  
  // Clear all user-specific cache on logout
  clearUserCache: () => {
    console.log('🗑️ Clearing user-specific cache data');
    
    // Clear common user-specific cache patterns
    const userPatterns = [
      'habits',
      'mood',
      'stats',
      'study',
      'journal',
      'calendar',
      'goals',
      'daily',
      'user'
    ];
    
    userPatterns.forEach(pattern => {
      cacheService.invalidateByPattern(pattern);
    });
    
    // Also clear the main cache storage if needed
    // Note: This is aggressive but ensures clean state
    cacheService.clear();
  }
}; 