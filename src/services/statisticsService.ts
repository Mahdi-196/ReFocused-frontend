import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { statisticsApiService, BackendStatistics } from '@/api/services/statisticsService';
import { timeService } from './timeService';
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
    // Use timeService for consistent date handling
    const today = timeService.getCurrentDate();
    const weekStart = timeService.getStartOfWeek();
    const monthStart = timeService.getStartOfMonth();
    
    const keys = [
      `${CacheKeys.STATISTICS_DAILY}_${today}_${userId}`,
      `${CacheKeys.STATISTICS_WEEKLY}_${weekStart}_${userId}`,
      `${CacheKeys.STATISTICS_MONTHLY}_${monthStart}_${userId}`
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
      logger.warn('Error reading from localStorage', error, 'FALLBACK');
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
 * Enhanced Date calculation utilities - Time Service Based
 * Uses time service to ensure consistency with backend time
 */
class DateUtils {
  /**
   * Get current date using time service
   */
  static getCurrentDate(): string {
    return timeService.getCurrentDate();
  }

  static getStartOfWeek(): string {
    return timeService.getStartOfWeek();
  }

  static getStartOfMonth(): string {
    return timeService.getStartOfMonth();
  }

  static getDateRange(filter: TimeFilter): { start: string; end: string } {
    const today = timeService.getCurrentDate();
    
    let range;
    switch (filter) {
      case 'D':
        range = { start: today, end: today };
        break;
      case 'W':
        range = { start: timeService.getStartOfWeek(), end: today };
        break;
      case 'M':
        range = { start: timeService.getStartOfMonth(), end: today };
        break;
      default:
        range = { start: today, end: today };
    }
    
    console.log(`🕐 [DATE] Filter ${filter} range (time service):`, range);
    return range;
  }

  /**
   * Check if we're in a new week (Monday start)
   */
  static isNewWeek(): boolean {
    const lastWeekStart = localStorage.getItem('lastWeekStart');
    const currentWeekStart = timeService.getStartOfWeek();
    return lastWeekStart !== currentWeekStart;
  }

  /**
   * Check if we're in a new month
   */
  static isNewMonth(): boolean {
    const lastMonthStart = localStorage.getItem('lastMonthStart');
    const currentMonthStart = timeService.getStartOfMonth();
    return lastMonthStart !== currentMonthStart;
  }

  /**
   * Update tracking for week/month changes
   */
  static updateResetTracking(): void {
    localStorage.setItem('lastWeekStart', timeService.getStartOfWeek());
    localStorage.setItem('lastMonthStart', timeService.getStartOfMonth());
  }

  static debugDates(): Record<string, string | number | boolean> {
    const now = timeService.getCurrentDateTime();
    const currentDate = timeService.getCurrentDate();
    const weekStart = timeService.getStartOfWeek();
    const monthStart = timeService.getStartOfMonth();
    const isMock = timeService.isMockDate();
    
    return {
      currentDateTime: now,
      currentDate,
      weekStart,
      monthStart,
      isMockDate: isMock,
      timezone: timeService.getUserTimezone()
    };
  }
}

/**
 * Main Statistics Service
 * Handles caching, API calls, and fallbacks
 */
class StatisticsService {
  private isApiAvailable: boolean | null = null;
  private timeListeners: { handleDayChange: () => void; handleMockDateChange: () => void } | null = null;

  constructor() {
    // Setup time listeners for cache invalidation
    this.setupTimeListeners();
  }

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
   * Dispatch update events for all time filters to ensure all views refresh
   */
  private dispatchAllFiltersUpdate(): void {
    // Dispatch generic update event for components listening to any changes
    window.dispatchEvent(new CustomEvent('statisticsUpdated'));
    
    // Dispatch specific events for each time filter for future use
    window.dispatchEvent(new CustomEvent('statisticsUpdated:daily'));
    window.dispatchEvent(new CustomEvent('statisticsUpdated:weekly'));
    window.dispatchEvent(new CustomEvent('statisticsUpdated:monthly'));
    
    logger.debug('Dispatched update events for all time filters', undefined, 'SERVICE');
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
   * Convert API response to frontend format
   */
  private convertBackendStats(backendStats: BackendStatistics): Statistics {
    return {
      focusTime: backendStats.focus_time || backendStats.focusTime || 0,
      sessions: backendStats.sessions || 0,
      tasksDone: backendStats.tasks_done || backendStats.tasksDone || 0,
    };
  }

  /**
   * Get filtered statistics with caching
   */
  async getFilteredStats(filter: TimeFilter = 'D'): Promise<Statistics> {
    const cacheKey = this.getCacheKey(filter);
    
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
        const backendStats = await statisticsApiService.getStatisticsByFilter(filter);
        const stats = this.convertBackendStats(backendStats);
        
        // Cache the result
        cacheService.set(cacheKey, stats, CacheTTL.SHORT);
        logger.info('Statistics loaded from API and cached', { filter, stats, cacheKey }, 'SERVICE');
        
        return stats;
      } catch (error) {
        logger.warn('API failed, using fallback', error, 'SERVICE');
        this.isApiAvailable = false; // Mark API as unavailable
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.get();
    logger.debug('Using localStorage fallback', { filter, fallbackStats }, 'SERVICE');
    return fallbackStats;
  }

  /**
   * Add focus time
   */
  async addFocusTime(minutes: number, filter: TimeFilter = 'D'): Promise<Statistics> {
    logger.info(`Adding ${minutes} minutes focus time`, undefined, 'SERVICE');

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.addFocusTime(minutes);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        this.dispatchAllFiltersUpdate();
        
        logger.info('Focus time added via API', undefined, 'SERVICE');
        return await this.getFilteredStats(filter);
      } catch (error) {
        logger.warn('API failed for focus time, using fallback', error, 'SERVICE');
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.addFocusTime(minutes);
    this.dispatchAllFiltersUpdate();
    logger.debug('Focus time added via fallback', fallbackStats, 'SERVICE');
    
    return await this.getFilteredStats(filter);
  }

  /**
   * Increment sessions
   */
  async incrementSessions(filter: TimeFilter = 'D'): Promise<Statistics> {
    logger.info('Incrementing sessions', undefined, 'SERVICE');

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.incrementSessions(1);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        this.dispatchAllFiltersUpdate();
        
        logger.info('Sessions incremented via API', undefined, 'SERVICE');
        return await this.getFilteredStats(filter);
      } catch (error) {
        logger.warn('API failed for sessions, using fallback', error, 'SERVICE');
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.incrementSessions();
    this.dispatchAllFiltersUpdate();
    logger.debug('Sessions incremented via fallback', fallbackStats, 'SERVICE');
    
    return await this.getFilteredStats(filter);
  }

  /**
   * Increment tasks done
   */
  async incrementTasksDone(filter: TimeFilter = 'D'): Promise<Statistics> {
    logger.info('Incrementing tasks done', undefined, 'SERVICE');

    const apiAvailable = await this.checkApiAvailability();
    
    if (apiAvailable) {
      try {
        await statisticsApiService.incrementTasks(1);
        
        // Invalidate cache and refresh
        CacheInvalidation.invalidateStatsData('current');
        this.dispatchAllFiltersUpdate();
        
        logger.info('Tasks incremented via API', undefined, 'SERVICE');
        return await this.getFilteredStats(filter);
      } catch (error) {
        logger.warn('API failed for tasks, using fallback', error, 'SERVICE');
        this.isApiAvailable = false;
      }
    }

    // Fallback to localStorage
    const fallbackStats = LocalStorageFallback.incrementTasks();
    this.dispatchAllFiltersUpdate();
    logger.debug('Tasks incremented via fallback', fallbackStats, 'SERVICE');
    
    return await this.getFilteredStats(filter);
  }

  /**
   * Force refresh statistics (bypass cache)
   */
  async refreshStatistics(filter: TimeFilter = 'D'): Promise<Statistics> {
    logger.info(`Force refreshing statistics for filter: ${filter}`, undefined, 'SERVICE');
    
    // Clear cache first
    const cacheKey = this.getCacheKey(filter);
    cacheService.delete(cacheKey);
    
    // Clear all cache for current user to be safe
    CacheInvalidation.invalidateStatsData('current');
    
    // Reset API availability check
    this.isApiAvailable = null;
    
    // Get fresh data
    return await this.getFilteredStats(filter);
  }

  /**
   * Set statistics to specific values
   */
  async setStatistics(stats: Statistics): Promise<Statistics> {
    logger.info('Setting statistics to specific values', stats, 'SERVICE');
    
    // Store in localStorage (always available)
    LocalStorageFallback.set(stats);
    
    // Clear cache to force refresh
    CacheInvalidation.invalidateStatsData('current');
    
    // Try to sync with API if available
    const apiAvailable = await this.checkApiAvailability();
    if (apiAvailable) {
      try {
        const today = DateUtils.getCurrentDate();
        await statisticsApiService.updateStatistics(today, {
          focus_time: stats.focusTime,
          sessions: stats.sessions,
          tasks_done: stats.tasksDone
        });
        logger.info('Statistics synced with API', stats, 'SERVICE');
      } catch (error) {
        logger.warn('Failed to sync with API, using localStorage only', error, 'SERVICE');
      }
    }
    
    // Dispatch update events for all time filters
    this.dispatchAllFiltersUpdate();
    
    return stats;
  }

  /**
   * Check if it's past midnight and reset if needed
   * Also handles week and month resets
   */
  async checkAndResetAtMidnight(): Promise<void> {
    const lastResetDate = localStorage.getItem('lastStatisticsReset');
    const currentDate = DateUtils.getCurrentDate();
    
    let resetOccurred = false;
    
    // Check for new day (daily reset)
    if (lastResetDate !== currentDate) {
      logger.info('New day detected - resetting daily statistics', { lastResetDate, currentDate }, 'SERVICE');
      
      // Reset daily statistics
      await this.setStatistics({ focusTime: 0, sessions: 0, tasksDone: 0 });
      
      // Update last reset date
      localStorage.setItem('lastStatisticsReset', currentDate);
      resetOccurred = true;
      
      logger.info('Daily statistics reset completed', undefined, 'SERVICE');
    }
    
    // Check for new week
    if (DateUtils.isNewWeek()) {
      logger.info('New week detected - clearing weekly cache', undefined, 'SERVICE');
      cacheService.delete(`${CacheKeys.STATISTICS_WEEKLY}_${DateUtils.getStartOfWeek()}_current`);
      resetOccurred = true;
    }
    
    // Check for new month
    if (DateUtils.isNewMonth()) {
      logger.info('New month detected - clearing monthly cache', undefined, 'SERVICE');
      cacheService.delete(`${CacheKeys.STATISTICS_MONTHLY}_${DateUtils.getStartOfMonth()}_current`);
      resetOccurred = true;
    }
    
    // Update tracking
    if (resetOccurred) {
      DateUtils.updateResetTracking();
      this.dispatchAllFiltersUpdate();
    }
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
    
    // Clear reset tracking
    localStorage.removeItem('lastStatisticsReset');
    
    // Dispatch update events for all time filters
    this.dispatchAllFiltersUpdate();
    
    logger.info('All statistics data cleared', undefined, 'SERVICE');
  }

  /**
   * Clear cache when mock date changes
   */
  clearCacheForMockDateChange(): void {
    logger.info('Clearing statistics cache due to mock date change', undefined, 'SERVICE');
    CacheInvalidation.invalidateStatsData('current');
    
    // Also reset API availability to force fresh API calls
    this.isApiAvailable = null;
  }

  /**
   * Setup listeners for time-related changes
   */
  setupTimeListeners(): void {
    if (typeof window === 'undefined') return;
    
    // Listen for day changes
    const handleDayChange = () => {
      logger.info('Day changed, clearing statistics cache', undefined, 'SERVICE');
      CacheInvalidation.invalidateStatsData('current');
    };
    
    // Listen for mock date changes (custom event)
    const handleMockDateChange = () => {
      logger.info('Mock date changed, clearing statistics cache', undefined, 'SERVICE');
      this.clearCacheForMockDateChange();
    };
    
    window.addEventListener('dayChanged', handleDayChange);
    window.addEventListener('mockDateChanged', handleMockDateChange);
    
    // Store listeners for cleanup
    this.timeListeners = { handleDayChange, handleMockDateChange };
  }

  /**
   * Cleanup time listeners
   */
  cleanupTimeListeners(): void {
    if (typeof window === 'undefined' || !this.timeListeners) return;
    
    window.removeEventListener('dayChanged', this.timeListeners.handleDayChange);
    window.removeEventListener('mockDateChanged', this.timeListeners.handleMockDateChange);
    this.timeListeners = null;
  }

  /**
   * Get debug information about current dates and ranges
   */
  getDebugInfo(): Record<string, unknown> {
    const currentDate = DateUtils.getCurrentDate();
    const isMockDate = timeService.isMockDate();
    const timezone = timeService.getUserTimezone();
    
    const dailyRange = DateUtils.getDateRange('D');
    const weeklyRange = DateUtils.getDateRange('W');
    const monthlyRange = DateUtils.getDateRange('M');
    
    return {
      currentDate,
      isMockDate,
      timezone,
      ranges: {
        daily: dailyRange,
        weekly: weeklyRange,
        monthly: monthlyRange
      },
      cacheKeys: {
        daily: this.getCacheKey('D'),
        weekly: this.getCacheKey('W'),
        monthly: this.getCacheKey('M')
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
export const addFocusTime = (minutes: number, filter: TimeFilter = 'D'): Promise<Statistics> => statisticsService.addFocusTime(minutes, filter);
export const incrementSessions = (filter: TimeFilter = 'D'): Promise<Statistics> => statisticsService.incrementSessions(filter);
export const incrementTasksDone = (filter: TimeFilter = 'D'): Promise<Statistics> => statisticsService.incrementTasksDone(filter);
export const setStatistics = (stats: Statistics): Promise<Statistics> => statisticsService.setStatistics(stats);
export const checkAndResetAtMidnight = (): Promise<void> => statisticsService.checkAndResetAtMidnight();
export const refreshStatistics = (filter: TimeFilter = 'D'): Promise<Statistics> => statisticsService.refreshStatistics(filter);
export const clearAllStatistics = (): Promise<void> => statisticsService.clearAllData();
export const resetApiAvailability = (): void => statisticsService.resetApiAvailability();
export const clearCacheForMockDateChange = (): void => statisticsService.clearCacheForMockDateChange();
export const getStatisticsDebugInfo = (): Record<string, unknown> => statisticsService.getDebugInfo();

// Export utility classes
export { LocalStorageFallback, DateUtils, CacheInvalidation }; 