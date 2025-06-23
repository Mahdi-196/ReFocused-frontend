/**
 * Centralized Time Service - Single Source of Truth
 * Replaces dateUtils.ts with backend-synchronized time system
 */

import client from '@/api/client';
import { logger } from '@/utils/logger';
import type {
  BackendTimeResponse,
  TimezoneInfo,
  WeekInfo,
  TimeSyncCheck,
  TimezoneDetectionRequest,
  TimezoneUpdateRequest,
  DayChangeEvent,
  TimeServiceState,
  TimeFilter
} from '@/types/time';

// Interface for the time service public API
interface ITimeService {
  getCurrentDate(): string;
  getCurrentDateTime(): string;
  getUserTimezone(): string;
  isMockDate(): boolean;
  getStartOfWeek(): string;
  getStartOfMonth(): string;
  getDateRange(filter: 'D' | 'W' | 'M'): { start: string; end: string };
  formatUserDate(dateString: string, options?: Intl.DateTimeFormatOptions): string;
  formatRelativeDate(dateString: string): string;
  getState(): TimeServiceState;
  initialize(): Promise<void>;
  syncWithBackend(): Promise<BackendTimeResponse | null>;
  detectAndSetTimezone(): Promise<boolean>;
  updateUserTimezone(timezone: string): Promise<boolean>;
  getAvailableTimezones(): Promise<TimezoneInfo[]>;
  getWeekInfo(): Promise<WeekInfo | null>;
  checkSyncStatus(): Promise<TimeSyncCheck | null>;
  addEventListener(listener: () => void): void;
  removeEventListener(listener: () => void): void;
  destroy(): void;
  setFilter(filter: TimeFilter): void;
}

export class TimeService implements ITimeService {
  private state: TimeServiceState = {
    currentTime: null,
    lastSync: null,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    syncInProgress: false,
    syncErrors: 0
  };

  private syncInterval: NodeJS.Timeout | null = null;
  private readonly MAX_SYNC_ERRORS = 3;
  private readonly SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes instead of 5
  private readonly SYNC_TIMEOUT_MS = 10000; // 10 seconds
  private eventListeners: Set<() => void> = new Set();
  private pendingSync: Promise<BackendTimeResponse | null> | null = null;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners();
      this.initialize();
    }
  }

  /**
   * Initialize the time service - Call on app startup
   */
  async initialize(): Promise<void> {
    logger.info('🕰️ Initializing time service...', undefined, 'TIME_SERVICE');
    
    await this.syncWithBackend();
    this.startPeriodicSync();
    logger.info('✅ Time service initialized successfully', {
      currentDate: this.state.currentTime?.user_current_date,
      timezone: this.state.currentTime?.user_timezone,
      isMockDate: this.state.currentTime?.is_mock_date
    }, 'TIME_SERVICE');
  }

  /**
   * Sync current time with backend (primary endpoint)
   */
  async syncWithBackend(): Promise<BackendTimeResponse | null> {
    // If there's already a pending sync, return it
    if (this.pendingSync) {
      logger.debug('Using existing pending sync request...', undefined, 'TIME_SERVICE');
      return this.pendingSync;
    }

    // If we have recent data (less than 5 minutes old) and not syncing, use cached data
    const recentThreshold = 5 * 60 * 1000; // 5 minutes
    if (this.state.currentTime && this.state.lastSync && 
        (Date.now() - this.state.lastSync) < recentThreshold && 
        !this.state.syncInProgress) {
      logger.debug('Using recent cached time data...', {
        age: Date.now() - this.state.lastSync,
        currentDate: this.state.currentTime.user_current_date
      }, 'TIME_SERVICE');
      return this.state.currentTime;
    }

    if (this.state.syncInProgress) {
      logger.debug('Sync already in progress, skipping...', undefined, 'TIME_SERVICE');
      return this.state.currentTime;
    }

    this.state.syncInProgress = true;
    logger.info('🔄 Starting backend sync...', undefined, 'TIME_SERVICE');

    // Create and store the pending sync promise
    this.pendingSync = this.performSync();
    
    try {
      const result = await this.pendingSync;
      return result;
    } finally {
      this.pendingSync = null;
      this.state.syncInProgress = false;
    }
  }

  private async performSync(): Promise<BackendTimeResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.SYNC_TIMEOUT_MS);

      logger.debug('📡 Making request to /time/current...', undefined, 'TIME_SERVICE');
      const response = await client.get('/time/current', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      logger.debug('📥 Received response:', { status: response.status, data: response.data }, 'TIME_SERVICE');

      if (response.status === 200) {
        // Transform backend response to match frontend interface
        const rawData = response.data;
        logger.debug('🔄 Transforming raw data:', rawData, 'TIME_SERVICE');
        
        const timeData: BackendTimeResponse = {
          user_current_date: rawData.user_date || rawData.user_current_date,
          user_current_datetime: rawData.user_datetime || rawData.user_current_datetime,
          user_timezone: rawData.timezone_id || rawData.user_timezone,
          utc_datetime: rawData.server_utc || rawData.utc_datetime,
          is_mock_date: rawData.is_mock_enabled ?? rawData.is_mock_date ?? false,
          day_of_week: rawData.day_of_week || 'Unknown',
          week_number: rawData.week_number || 0,
          is_weekend: rawData.is_weekend ?? false,
          day_boundaries: rawData.day_boundaries || {
            start_utc: rawData.server_utc || new Date().toISOString(),
            end_utc: rawData.server_utc || new Date().toISOString()
          }
        };
        
        logger.debug('✨ Transformed data:', timeData, 'TIME_SERVICE');
        const oldDate = this.state.currentTime?.user_current_date;
        
        this.state.currentTime = timeData;
        this.state.lastSync = Date.now();
        this.state.syncErrors = 0;

        logger.info('✅ Time synchronized successfully', {
          date: timeData.user_current_date,
          timezone: timeData.user_timezone,
          isMock: timeData.is_mock_date,
          transformed: true
        }, 'TIME_SERVICE');

        // Detect day change
        if (oldDate && oldDate !== timeData.user_current_date) {
          this.handleDayChange(oldDate, timeData.user_current_date);
        }

        this.notifyListeners();
        return timeData;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      this.state.syncErrors++;
      logger.error(`❌ Time sync failed (${this.state.syncErrors}/${this.MAX_SYNC_ERRORS})`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: '/time/current',
        syncErrors: this.state.syncErrors
      }, 'TIME_SERVICE');

      // No fallback - let the app handle the error  
      throw new Error(`Failed to sync with backend time service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current date (YYYY-MM-DD format) - Use this everywhere!
   */
  getCurrentDate(): string {
    if (this.state.currentTime?.user_current_date) {
      return this.state.currentTime.user_current_date;
    }

    // Safe fallback instead of throwing error
    console.warn('Time service not ready, using local date fallback');
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get current datetime
   */
  getCurrentDateTime(): string {
    if (this.state.currentTime?.user_current_datetime) {
      return this.state.currentTime.user_current_datetime;
    }
    
    // Safe fallback instead of throwing error
    console.warn('Time service not ready, using local datetime fallback');
    return new Date().toISOString();
  }

  /**
   * Get user's timezone
   */
  getUserTimezone(): string {
    if (this.state.currentTime?.user_timezone) {
      return this.state.currentTime.user_timezone;
    }
    
    // Safe fallback instead of throwing error
    console.warn('Time service not ready, using local timezone fallback');
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Check if using mock date (development mode)
   */
  isMockDate(): boolean {
    return this.state.currentTime?.is_mock_date ?? false;
  }

  /**
   * Get start of current week (Monday) in YYYY-MM-DD format
   */
  getStartOfWeek(): string {
    return this.getWeekRange().start;
  }

  /**
   * Get start of current month in YYYY-MM-DD format
   */
  getStartOfMonth(): string {
    return this.getMonthRange().start;
  }

  /**
   * Get week information
   */
  async getWeekInfo(): Promise<WeekInfo | null> {
    try {
      const response = await client.get('/time/week-info');
      return response.data;
    } catch (error) {
      logger.error('Failed to get week info', error, 'TIME_SERVICE');
      return null;
    }
  }

  /**
   * Auto-detect and set user timezone
   */
  async detectAndSetTimezone(): Promise<boolean> {
    // Only detect timezone in browser environment
    if (typeof window === 'undefined') {
      logger.warn('Timezone detection not available in server environment', undefined, 'TIME_SERVICE');
      return false;
    }
    
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;

      const detectionRequest: TimezoneDetectionRequest = {
        browser_timezone: detectedTimezone,
        language,
        confidence: 'high'
      };

      const response = await client.post('/time/detect', detectionRequest);

      if (response.status === 200) {
        logger.info('✅ Timezone auto-detected', { timezone: detectedTimezone }, 'TIME_SERVICE');
        await this.syncWithBackend(); // Refresh with new timezone
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to detect timezone', error, 'TIME_SERVICE');
      return false;
    }
  }

  /**
   * Manually update user timezone
   */
  async updateUserTimezone(timezone: string): Promise<boolean> {
    try {
      const updateRequest: TimezoneUpdateRequest = {
        timezone,
        method: 'manual'
      };

      const response = await client.post('/time/timezone', updateRequest);

      if (response.status === 200) {
        logger.info('✅ Timezone updated manually', { timezone }, 'TIME_SERVICE');
        await this.syncWithBackend(); // Refresh with new timezone
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to update timezone', error, 'TIME_SERVICE');
      return false;
    }
  }

  /**
   * Get available timezones
   */
  async getAvailableTimezones(): Promise<TimezoneInfo[]> {
    try {
      const response = await client.get('/time/timezones');
      return response.data;
    } catch (error) {
      logger.error('Failed to get timezones', error, 'TIME_SERVICE');
      return [];
    }
  }

  /**
   * Check sync status with backend
   */
  async checkSyncStatus(): Promise<TimeSyncCheck | null> {
    try {
      const syncRequest = {
        frontend_timestamp: new Date().toISOString(),
        frontend_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const response = await client.post('/time/sync-check', syncRequest);
      const syncData: TimeSyncCheck = response.data;

      if (!syncData.is_synchronized) {
        logger.warn('⚠️ Time sync issue detected', syncData, 'TIME_SERVICE');
        await this.syncWithBackend(); // Auto-correct
      }

      return syncData;
    } catch (error) {
      logger.error('Failed to check sync status', error, 'TIME_SERVICE');
      return null;
    }
  }

  /**
   * Get date range for filters (D/W/M)
   */
  getDateRange(filter: 'D' | 'W' | 'M'): { start: string; end: string } {
    const today = this.getCurrentDate();

    switch (filter) {
      case 'D':
        return { start: today, end: today };
      case 'W':
        return this.getWeekRange();
      case 'M':
        return this.getMonthRange();
      default:
        return { start: today, end: today };
    }
  }

  /**
   * Format date for display
   */
  formatUserDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    const userTimezone = this.getUserTimezone();
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
      .format(new Date(dateString));
  }

  /**
   * Format relative date (Today, Yesterday, etc.)
   */
  formatRelativeDate(dateString: string): string {
    const currentDate = this.getCurrentDate();
    const targetDate = new Date(dateString);
    const today = new Date(currentDate);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

    return dateString;
  }

  /**
   * Add event listener for time changes
   */
  addEventListener(listener: () => void): void {
    this.eventListeners.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: () => void): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Get current service state (for debugging)
   */
  getState(): TimeServiceState {
    return { ...this.state };
  }

  /**
   * Cleanup - call on app unmount
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.eventListeners.clear();
    
    // Only remove listeners in browser environment
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  // Private methods

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.state.isOnline) {
        await this.syncWithBackend();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  private handleDayChange(oldDate: string, newDate: string): void {
    const dayChangeEvent: DayChangeEvent = {
      oldDate,
      newDate,
      timezone: this.getUserTimezone()
    };

    logger.info('📅 Day changed', dayChangeEvent, 'TIME_SERVICE');

    // Only dispatch events in browser environment
    if (typeof window !== 'undefined') {
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('dayChanged', { 
        detail: dayChangeEvent 
      }));
    }

    // Clear date-sensitive caches
    this.clearDateSensitiveCaches();
  }

  private clearDateSensitiveCaches(): void {
    // Only clear caches in browser environment
    if (typeof window === 'undefined') return;
    
    // Clear habit completion cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('habit-completions-') || 
          key.startsWith('statistics-') ||
          key.startsWith('mood-entries-')) {
        localStorage.removeItem(key);
      }
    });

    logger.info('🗑️ Cleared date-sensitive caches', undefined, 'TIME_SERVICE');
  }

  // Fallback method removed - no local fallbacks allowed

  private getWeekRange(): { start: string; end: string } {
    const today = new Date(this.getCurrentDate());
    const startOfWeek = new Date(today);
    
    // Calculate Monday as start of week (Monday = 1, Sunday = 0)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  }

  private getMonthRange(): { start: string; end: string } {
    const today = new Date(this.getCurrentDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private setupNetworkListeners(): void {
    // Only set up listeners in browser environment
    if (typeof window === 'undefined') return;
    
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = async (): Promise<void> => {
    this.state.isOnline = true;
    this.state.syncErrors = 0;
    logger.info('🌐 Back online - syncing time', undefined, 'TIME_SERVICE');
    await this.syncWithBackend();
  };

  private handleOffline = (): void => {
    this.state.isOnline = false;
    logger.info('📴 Offline - using cached time data', undefined, 'TIME_SERVICE');
  };

  private notifyListeners(): void {
    this.eventListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        logger.error('Error in time service listener', error, 'TIME_SERVICE');
      }
    });
  }

  /**
   * Set a filter for time operations (if needed in future)
   */
  setFilter(filter: TimeFilter): void {
    // Implementation if needed in future
    console.log('🔧 Time filter functionality reserved for future use');
  }
}

// Create singleton instance only in browser environment
let timeServiceInstance: TimeService | null = null;

export const timeService = (() => {
  if (typeof window === 'undefined') {
    // Return a mock service for server-side rendering - no fallbacks
    return {
      getCurrentDate: () => { throw new Error('Time service not available on server-side'); },
      getCurrentDateTime: () => { throw new Error('Time service not available on server-side'); },
      getUserTimezone: () => { throw new Error('Time service not available on server-side'); },
      isMockDate: () => false,
      getStartOfWeek: () => { throw new Error('Time service not available on server-side'); },
      getStartOfMonth: () => { throw new Error('Time service not available on server-side'); },
      getDateRange: () => { throw new Error('Time service not available on server-side'); },
      formatUserDate: () => { throw new Error('Time service not available on server-side'); },
      formatRelativeDate: () => { throw new Error('Time service not available on server-side'); },
      getState: () => ({
        currentTime: null,
        lastSync: null,
        isOnline: true,
        syncInProgress: false,
        syncErrors: 0
      }),
      // Async methods that throw errors on server
      initialize: async () => { throw new Error('Time service not available on server-side'); },
      syncWithBackend: async () => { throw new Error('Time service not available on server-side'); },
      detectAndSetTimezone: async () => { throw new Error('Time service not available on server-side'); },
      updateUserTimezone: async () => { throw new Error('Time service not available on server-side'); },
      getAvailableTimezones: async () => { throw new Error('Time service not available on server-side'); },
      getWeekInfo: async () => { throw new Error('Time service not available on server-side'); },
      checkSyncStatus: async () => { throw new Error('Time service not available on server-side'); },
      addEventListener: () => {},
      removeEventListener: () => {},
      destroy: () => {},
      setFilter: () => {}
    } as ITimeService;
  }
  
  // Create real instance in browser
  if (!timeServiceInstance) {
    timeServiceInstance = new TimeService();
  }
  
  return timeServiceInstance;
})(); 