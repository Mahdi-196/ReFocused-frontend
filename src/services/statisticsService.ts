import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { statisticsApiService, StatisticsEntry, StatisticsRequest } from '@/api/services/statisticsService';

/**
 * Statistics Display Types
 */
export interface Statistics {
  focusTime: number;
  sessions: number;
  tasksDone: number;
}

export type TimeFilter = 'D' | 'W' | 'M';

/**
 * Cache invalidation helper for statistics
 */
class CacheInvalidation {
  static invalidateStatsData(userId: string | number) {
    const today = new Date().toISOString().split('T')[0];
    const keys = [
      `${CacheKeys.STATISTICS_DAILY}_${today}_${userId}`,
      `${CacheKeys.STATISTICS_WEEKLY}_${today}_${userId}`,
      `${CacheKeys.STATISTICS_MONTHLY}_${today}_${userId}`
    ];
    
    keys.forEach(key => {
      cacheService.delete(key);
      console.log(`🗑️ [CACHE] Invalidated: ${key}`);
    });
  }
}

/**
 * LocalStorage fallback for offline functionality
 */
class LocalStorageFallback {
  private static STORAGE_KEY = 'refocused_statistics';

  static get(): Statistics {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('🚨 [FALLBACK] Error reading from localStorage:', error);
    }
    
    return { focusTime: 0, sessions: 0, tasksDone: 0 };
  }

  static set(stats: Statistics): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
      console.log('💾 [FALLBACK] Saved to localStorage:', stats);
    } catch (error) {
      console.warn('🚨 [FALLBACK] Error saving to localStorage:', error);
    }
  }

  static update(updates: Partial<Statistics>): Statistics {
    const current = this.get();
    const updated = { ...current, ...updates };
    this.set(updated);
    return updated;
  }

  static addFocusTime(minutes: number): Statistics {
    const current = this.get();
    const updated = { ...current, focusTime: current.focusTime + minutes };
    this.set(updated);
    return updated;
  }

  static incrementSessions(): Statistics {
    const current = this.get();
    const updated = { ...current, sessions: current.sessions + 1 };
    this.set(updated);
    return updated;
  }

  static incrementTasks(): Statistics {
    const current = this.get();
    const updated = { ...current, tasksDone: current.tasksDone + 1 };
    this.set(updated);
    return updated;
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ [FALLBACK] Cleared localStorage');
  }
}

/**
 * Date calculation utilities
 */
class DateUtils {
  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  static getStartOfWeek(): string {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  }

  static getStartOfMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }

  static getDateRange(filter: TimeFilter): { start: string; end: string } {
    const today = this.getCurrentDate();
    
    switch (filter) {
      case 'D':
        return { start: today, end: today };
      case 'W':
        return { start: this.getStartOfWeek(), end: today };
      case 'M':
        return { start: this.getStartOfMonth(), end: today };
      default:
        return { start: today, end: today };
    }
  }
}

/**
 * Main Statistics Service
 * Handles caching, API calls, and fallbacks
 */
class StatisticsService {
  private isApiAvailable: boolean | null = null;

  /**
   * Check API availability (cached for session)
   */
  private async checkApiAvailability(): Promise<boolean> {
    if (this.isApiAvailable !== null) {
      return this.isApiAvailable;
    }

    try {
      this.isApiAvailable = await statisticsApiService.healthCheck();
             console.log(`🔍 [SERVICE] API availability: ${this.isApiAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
     } catch {
       this.isApiAvailable = false;
    }

    return this.isApiAvailable;
  }

  /**
   * Generate cache key for statistics
   */
  private getCacheKey(filter: TimeFilter): string {
    const today = DateUtils.getCurrentDate();
    const userId = 'current'; // Will be replaced with actual user ID
    
    switch (filter) {
      case 'D':
        return `${CacheKeys.STATISTICS_DAILY}_${today}_${userId}`;
      case 'W':
        return `${CacheKeys.STATISTICS_WEEKLY}_${today}_${userId}`;
      case 'M':
        return `${CacheKeys.STATISTICS_MONTHLY}_${today}_${userId}`;
      default:
        return `${CacheKeys.STATISTICS_DAILY}_${today}_${userId}`;
    }
  }

  /**
   * Convert API entries to display format
   */
  private aggregateApiEntries(entries: StatisticsEntry[]): Statistics {
    if (!entries?.length) {
      return { focusTime: 0, sessions: 0, tasksDone: 0 };
    }

    return entries.reduce((total, entry) => ({
      focusTime: total.focusTime + (entry.focus_time || 0),
      sessions: total.sessions + (entry.sessions || 0),
      tasksDone: total.tasksDone + (entry.tasks_done || 0)
    }), { focusTime: 0, sessions: 0, tasksDone: 0 });
  }

  /**
   * Get filtered statistics with caching
   */
  async getFilteredStats(filter: TimeFilter = 'D'): Promise<Statistics> {
    const cacheKey = this.getCacheKey(filter);
    
    console.log(`📊 [SERVICE] getFilteredStats called, filter: ${filter}, cache key: ${cacheKey}`);
    
    // Check cache first
    const cached = cacheService.get<Statistics>(cacheKey);
    if (cached) {
      console.log(`✅ [SERVICE] Using cached statistics:`, cached);
      return cached;
    }

    console.log(`🌐 [SERVICE] Cache miss - Fetching from API`);

    // Check API availability
    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        const { start, end } = DateUtils.getDateRange(filter);
        const entries = await statisticsApiService.getStatistics(start, end);
        const stats = this.aggregateApiEntries(entries);
        
        // Cache the result
        cacheService.set(cacheKey, stats, CacheTTL.SHORT);
        console.log(`✅ [SERVICE] Statistics loaded from API and cached:`, stats);
        
        return stats;
      } catch (error) {
        console.warn(`🚨 [SERVICE] API failed, using fallback:`, error);
        this.isApiAvailable = false; // Mark API as unavailable
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.get();
    console.log(`💾 [SERVICE] Using localStorage fallback:`, fallbackStats);
    return fallbackStats;
  }

  /**
   * Add focus time
   */
  async addFocusTime(minutes: number): Promise<Statistics> {
    console.log(`⏱️ [SERVICE] Adding ${minutes} minutes focus time`);

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.addFocusTime(minutes);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        
        // Dispatch UI update event
        window.dispatchEvent(new CustomEvent('statisticsUpdated'));
        
        console.log(`✅ [SERVICE] Focus time added via API`);
        return await this.getFilteredStats('D');
      } catch (error) {
        console.warn(`🚨 [SERVICE] API failed for focus time, using fallback:`, error);
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.addFocusTime(minutes);
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    console.log(`💾 [SERVICE] Focus time added via fallback:`, fallbackStats);
    return fallbackStats;
  }

  /**
   * Increment sessions
   */
  async incrementSessions(): Promise<Statistics> {
    console.log(`📊 [SERVICE] Incrementing sessions`);

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.incrementSessions(1);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        
        // Dispatch UI update event
        window.dispatchEvent(new CustomEvent('statisticsUpdated'));
        
        console.log(`✅ [SERVICE] Sessions incremented via API`);
        return await this.getFilteredStats('D');
      } catch (error) {
        console.warn(`🚨 [SERVICE] API failed for sessions, using fallback:`, error);
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.incrementSessions();
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    console.log(`💾 [SERVICE] Sessions incremented via fallback:`, fallbackStats);
    return fallbackStats;
  }

  /**
   * Increment tasks done
   */
  async incrementTasksDone(): Promise<Statistics> {
    console.log(`✅ [SERVICE] Incrementing tasks done`);

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.incrementTasks(1);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        
        // Dispatch UI update event
        window.dispatchEvent(new CustomEvent('statisticsUpdated'));
        
        console.log(`✅ [SERVICE] Tasks incremented via API`);
        return await this.getFilteredStats('D');
      } catch (error) {
        console.warn(`🚨 [SERVICE] API failed for tasks, using fallback:`, error);
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.incrementTasks();
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    console.log(`💾 [SERVICE] Tasks incremented via fallback:`, fallbackStats);
    return fallbackStats;
  }

  /**
   * Force refresh statistics (bypass cache)
   */
  async refreshStatistics(filter: TimeFilter = 'D'): Promise<Statistics> {
    console.log(`🔄 [SERVICE] Force refreshing statistics for filter: ${filter}`);
    
    // Clear cache first
    const cacheKey = this.getCacheKey(filter);
    cacheService.delete(cacheKey);
    
    // Reset API availability check
    this.isApiAvailable = null;
    
    // Get fresh data
    return await this.getFilteredStats(filter);
  }

  /**
   * Clear all statistics data
   */
  async clearAllData(): Promise<void> {
    console.log(`🗑️ [SERVICE] Clearing all statistics data`);
    
    // Clear cache
    CacheInvalidation.invalidateStatsData('current');
    
    // Clear localStorage
    LocalStorageFallback.clear();
    
    // Reset API availability
    this.isApiAvailable = null;
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    
    console.log(`✅ [SERVICE] All statistics data cleared`);
  }

  /**
   * Debug: Get comprehensive service information
   */
  async getDebugInfo(): Promise<any> {
    const today = DateUtils.getCurrentDate();
    const apiAvailable = await this.checkApiAvailability();
    const fallbackData = LocalStorageFallback.get();
    
    return {
      apiAvailable,
      currentDate: today,
      dateRanges: {
        daily: DateUtils.getDateRange('D'),
        weekly: DateUtils.getDateRange('W'),
        monthly: DateUtils.getDateRange('M')
      },
      cacheKeys: {
        daily: this.getCacheKey('D'),
        weekly: this.getCacheKey('W'),
        monthly: this.getCacheKey('M')
      },
      fallbackData,
      cacheStats: cacheService.getStats(),
      cachedData: {
        daily: cacheService.get(this.getCacheKey('D')),
        weekly: cacheService.get(this.getCacheKey('W')),
        monthly: cacheService.get(this.getCacheKey('M'))
      }
    };
  }
}

// Create singleton instance
const statisticsService = new StatisticsService();

// Export the singleton and utility functions
export { statisticsService };

// Legacy exports for backward compatibility
export const getFilteredStats = (filter: TimeFilter = 'D'): Promise<Statistics> => statisticsService.getFilteredStats(filter);
export const addFocusTime = (minutes: number): Promise<Statistics> => statisticsService.addFocusTime(minutes);
export const incrementSessions = (): Promise<Statistics> => statisticsService.incrementSessions();
export const incrementTasksDone = (): Promise<Statistics> => statisticsService.incrementTasksDone();
export const refreshStatistics = (filter: TimeFilter = 'D'): Promise<Statistics> => statisticsService.refreshStatistics(filter);
export const clearAllStatistics = (): Promise<void> => statisticsService.clearAllData();

// Export utility classes
export { LocalStorageFallback, DateUtils, CacheInvalidation }; 