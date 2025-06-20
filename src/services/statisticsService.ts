import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { statisticsApiService, StatisticsEntry, BackendStatistics } from '@/api/services/statisticsService';
import logger from '@/utils/logger';

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
    // Use the same local date logic as DateUtils
    const today = DateUtils.getCurrentDate();
    const weekStart = DateUtils.getStartOfWeek();
    const monthStart = DateUtils.getStartOfMonth();
    
    const keys = [
      `${CacheKeys.STATISTICS_DAILY}_${today}_${userId}`,
      `${CacheKeys.STATISTICS_WEEKLY}_${weekStart}_${userId}`,
      `${CacheKeys.STATISTICS_MONTHLY}_${monthStart}_${userId}`
    ];
    
    keys.forEach(key => {
      cacheService.delete(key);
      logger.debug(`Cache invalidated: ${key}`, undefined, 'CACHE');
    });
    
    console.log(`🗑️ [CACHE] Invalidated cache for local date: ${today}`);
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
      logger.debug('Saved to localStorage', stats, 'FALLBACK');
    } catch (error) {
      logger.warn('Error saving to localStorage', error, 'FALLBACK');
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
    logger.debug('Cleared localStorage', undefined, 'FALLBACK');
  }
}

/**
 * Enhanced Date calculation utilities - User-Timezone Based
 * Uses local date to match user expectations (June 19th when it's June 19th locally)
 */
class DateUtils {
  /**
   * Get current date in user's local timezone
   * This matches user expectations and local calendar
   */
  static getCurrentDate(): string {
    const now = new Date();
    // Use local date (what the user sees on their calendar)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const localDate = `${year}-${month}-${day}`;
    console.log(`🕐 [DATE] Current local date: ${localDate} (Local time: ${now.toLocaleString()})`);
    return localDate;
  }

  static getStartOfWeek(): string {
    const now = new Date();
    // Calculate start of week in local timezone
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday = 0
    
    const year = startOfWeek.getFullYear();
    const month = String(startOfWeek.getMonth() + 1).padStart(2, '0');
    const day = String(startOfWeek.getDate()).padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    console.log(`🕐 [DATE] Start of week (local): ${result}`);
    return result;
  }

  static getStartOfMonth(): string {
    const now = new Date();
    // First day of current month in local timezone
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const year = startOfMonth.getFullYear();
    const month = String(startOfMonth.getMonth() + 1).padStart(2, '0');
    const day = String(startOfMonth.getDate()).padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    console.log(`🕐 [DATE] Start of month (local): ${result}`);
    return result;
  }

  static getDateRange(filter: TimeFilter): { start: string; end: string } {
    const today = this.getCurrentDate();
    
    let range;
    switch (filter) {
      case 'D':
        range = { start: today, end: today };
        break;
      case 'W':
        range = { start: this.getStartOfWeek(), end: today };
        break;
      case 'M':
        range = { start: this.getStartOfMonth(), end: today };
        break;
      default:
        range = { start: today, end: today };
    }
    
    console.log(`🕐 [DATE] Filter ${filter} range (local):`, range);
    return range;
  }

  /**
   * Debug method to show all date calculations
   */
  static debugDates(): Record<string, string> {
    const now = new Date();
    return {
      // Local timezone (what user sees)
      localDate: now.toDateString(),
      localTimeString: now.toLocaleString(),
      localCalculatedDate: this.getCurrentDate(),
      
      // UTC timezone (what backend might use)
      utcDate: now.toUTCString(),
      utcISOString: now.toISOString(),
      utcCalculatedDate: now.toISOString().split('T')[0],
      
      // System info
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      
      // Comparison
      note: 'Using LOCAL date to match user calendar expectations'
    };
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
      logger.info(`API availability: ${this.isApiAvailable ? 'Available' : 'Unavailable'}`, undefined, 'SERVICE');
     } catch {
       this.isApiAvailable = false;
    }

    return this.isApiAvailable;
  }

  /**
   * Reset API availability cache (forces a fresh check)
   */
  resetApiAvailability(): void {
    console.log('🔄 [API] Resetting API availability cache...');
    this.isApiAvailable = null;
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
   * Convert API snake_case to frontend camelCase
   */
  private convertBackendStats(backendStats: BackendStatistics): Statistics {
    return {
      focusTime: backendStats.focus_time || 0,
      sessions: backendStats.sessions || 0,
      tasksDone: backendStats.tasks_done || 0,
    };
  }

  /**
   * Get filtered statistics with caching
   */
  async getFilteredStats(filter: TimeFilter = 'D'): Promise<Statistics> {
    const cacheKey = this.getCacheKey(filter);
    
    logger.debug(`getFilteredStats called, filter: ${filter}, cache key: ${cacheKey}`, undefined, 'SERVICE');
    
    // Check cache first
    const cached = cacheService.get<Statistics>(cacheKey);
    if (cached) {
      logger.cacheHit(cacheKey);
      return cached;
    }

    logger.cacheMiss(cacheKey);

    // Check API availability
    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        const { start, end } = DateUtils.getDateRange(filter);
        const backendStats = await statisticsApiService.getStatistics(start, end);
        const stats = this.convertBackendStats(backendStats);
        
        // Cache the result
        cacheService.set(cacheKey, stats, CacheTTL.SHORT);
        logger.info('Statistics loaded from API and cached', stats, 'SERVICE');
        
        return stats;
      } catch (error) {
        logger.warn('API failed, using fallback', error, 'SERVICE');
        this.isApiAvailable = false; // Mark API as unavailable
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.get();
    logger.debug('Using localStorage fallback', fallbackStats, 'SERVICE');
    return fallbackStats;
  }

  /**
   * Add focus time
   */
  async addFocusTime(minutes: number): Promise<Statistics> {
    logger.info(`Adding ${minutes} minutes focus time`, undefined, 'SERVICE');

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.addFocusTime(minutes);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        
        // Dispatch UI update event
        window.dispatchEvent(new CustomEvent('statisticsUpdated'));
        
        logger.info('Focus time added via API', undefined, 'SERVICE');
        return await this.getFilteredStats('D');
      } catch (error) {
        logger.warn('API failed for focus time, using fallback', error, 'SERVICE');
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.addFocusTime(minutes);
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    logger.debug('Focus time added via fallback', fallbackStats, 'SERVICE');
    return fallbackStats;
  }

  /**
   * Increment sessions
   */
  async incrementSessions(): Promise<Statistics> {
    logger.info('Incrementing sessions', undefined, 'SERVICE');

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.incrementSessions(1);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        
        // Dispatch UI update event
        window.dispatchEvent(new CustomEvent('statisticsUpdated'));
        
        logger.info('Sessions incremented via API', undefined, 'SERVICE');
        return await this.getFilteredStats('D');
      } catch (error) {
        logger.warn('API failed for sessions, using fallback', error, 'SERVICE');
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.incrementSessions();
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    logger.debug('Sessions incremented via fallback', fallbackStats, 'SERVICE');
    return fallbackStats;
  }

  /**
   * Increment tasks done
   */
  async incrementTasksDone(): Promise<Statistics> {
    logger.info('Incrementing tasks done', undefined, 'SERVICE');

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.incrementTasks(1);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        
        // Dispatch UI update event
        window.dispatchEvent(new CustomEvent('statisticsUpdated'));
        
        logger.info('Tasks incremented via API', undefined, 'SERVICE');
        return await this.getFilteredStats('D');
      } catch (error) {
        logger.warn('API failed for tasks, using fallback', error, 'SERVICE');
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.incrementTasks();
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    logger.debug('Tasks incremented via fallback', fallbackStats, 'SERVICE');
    return fallbackStats;
  }

  /**
   * Force refresh statistics (bypass cache)
   */
  async refreshStatistics(filter: TimeFilter = 'D'): Promise<Statistics> {
    logger.info(`Force refreshing statistics for filter: ${filter}`, undefined, 'SERVICE');
    
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
    logger.info('Clearing all statistics data', undefined, 'SERVICE');
    
    // Clear cache
    CacheInvalidation.invalidateStatsData('current');
    
    // Clear localStorage
    LocalStorageFallback.clear();
    
    // Reset API availability
    this.isApiAvailable = null;
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    
    logger.info('All statistics data cleared', undefined, 'SERVICE');
  }

  /**
   * Comprehensive debug information for troubleshooting
   */
  async getDebugInfo(): Promise<Record<string, unknown>> {
    const userId = 'current';
    const filter = 'D';
    const cacheKey = this.getCacheKey(filter);
    const dateRange = DateUtils.getDateRange(filter);
    
    try {
      return {
        // Date and timezone information
        dateDebug: DateUtils.debugDates(),
        
        // Current configuration
        userId,
        filter,
        cacheKey,
        dateRange,
        
        // API availability
        apiAvailable: await this.checkApiAvailability(),
        
        // Cache status
        cached: cacheService.get(cacheKey) !== null,
        
        // Raw API response (if available)
        rawApiResponse: this.isApiAvailable ? 
          await statisticsApiService.getStatistics(dateRange.start, dateRange.end).catch(e => `Error: ${e.message}`) : 
          'API not available',
          
        // Current statistics
        currentStats: await this.getFilteredStats(filter),
        
        // System info
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side'
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        dateDebug: DateUtils.debugDates()
      };
    }
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
export const resetApiAvailability = (): void => statisticsService.resetApiAvailability();

// Export utility classes
export { LocalStorageFallback, DateUtils, CacheInvalidation }; 