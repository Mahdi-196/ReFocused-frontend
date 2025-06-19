import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { statisticsApiService, StatisticsEntry } from '@/api/services/statisticsService';
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
    const today = new Date().toISOString().split('T')[0];
    const keys = [
      `${CacheKeys.STATISTICS_DAILY}_${today}_${userId}`,
      `${CacheKeys.STATISTICS_WEEKLY}_${today}_${userId}`,
      `${CacheKeys.STATISTICS_MONTHLY}_${today}_${userId}`
    ];
    
    keys.forEach(key => {
      cacheService.delete(key);
      logger.debug(`Cache invalidated: ${key}`, undefined, 'CACHE');
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
      logger.info(`API availability: ${this.isApiAvailable ? 'Available' : 'Unavailable'}`, undefined, 'SERVICE');
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
        const entries = await statisticsApiService.getStatistics(start, end);
        const stats = this.aggregateApiEntries(entries);
        
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
   * Debug: Get comprehensive service information
   */
  async getDebugInfo(): Promise<Record<string, unknown>> {
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