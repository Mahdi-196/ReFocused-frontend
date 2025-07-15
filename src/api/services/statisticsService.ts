import client from "@/api/client";
import { STATISTICS } from "@/api/endpoints";
import logger from "@/utils/logger";
import { timeService } from "@/services/timeService";

/**
 * Statistics API Models - Backend Response Types
 */
export interface StatisticsEntry {
  id: number;
  user_id: number;
  focus_time: number; // minutes
  sessions: number;
  tasks_done: number;
  date: string; // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
}

export interface StatisticsRequest {
  focus_time?: number;
  sessions?: number;
  tasks_done?: number;
  date?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface BackendStatistics {
  focus_time?: number;
  focusTime?: number; // Keep both for compatibility
  sessions: number;
  tasks_done?: number;
  tasksDone?: number; // Keep both for compatibility
}

export interface DailyStatistics {
  date: string;
  focusTime: number;
  sessions: number;
  tasksDone: number;
}

export interface DetailedStatisticsResponse {
  summary: BackendStatistics;
  daily: DailyStatistics[];
}

/**
 * Enhanced error logging for API issues
 */
function logApiError(endpoint: string, error: unknown, payload?: unknown) {
  const apiError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
  logger.error(`API Error - Endpoint: ${endpoint}`, {
    endpoint,
    payload,
    status: apiError.response?.status,
    data: apiError.response?.data,
    message: apiError.response?.data?.message || apiError.message
  }, 'API');
}

/**
 * Statistics API Service
 * Pure API layer - no caching, no business logic
 */
export const statisticsApiService = {
  /**
   * Get statistics for a specific date range
   */
  async getStatistics(startDate: string, endDate: string): Promise<BackendStatistics> {
    try {
      logger.apiCall(STATISTICS.BASE, 'GET', { startDate, endDate });
      const response = await client.get<BackendStatistics>(STATISTICS.BASE, {
        params: { startDate, endDate }
      });
      // The API returns the aggregated object, or an object with zeros if no data.
      return response.data || { focusTime: 0, sessions: 0, tasksDone: 0 };
    } catch (error: unknown) {
      logApiError(STATISTICS.BASE, error, { startDate, endDate });
      // On error, return a zeroed object to prevent crashes
      return { focusTime: 0, sessions: 0, tasksDone: 0 };
    }
  },

  /**
   * Get statistics using filter parameter (D/W/M)
   */
  async getStatisticsByFilter(filter: 'D' | 'W' | 'M'): Promise<BackendStatistics> {
    try {
      const currentDate = timeService.getCurrentDate();
      
      const params = { 
        filter,
        current_date: currentDate  // Send current date to backend
      };
      
      logger.apiCall(STATISTICS.BASE, 'GET', params);
      const response = await client.get<BackendStatistics>(STATISTICS.BASE, {
        params
      });
      
      // The API returns the aggregated object, or an object with zeros if no data.
      return response.data || { focusTime: 0, sessions: 0, tasksDone: 0 };
    } catch (error: unknown) {
      logApiError(STATISTICS.BASE, error, { filter });
      // On error, return a zeroed object to prevent crashes
      return { focusTime: 0, sessions: 0, tasksDone: 0 };
    }
  },

  /**
   * Add focus time
   */
  async addFocusTime(minutes: number): Promise<StatisticsEntry> {
    try {
      const currentDate = timeService.getCurrentDate();
      
      const payload = {
        minutes: minutes,  // Backend expects: {"minutes": int}
        current_date: currentDate  // Send current date to backend
      };
      
      logger.apiCall(STATISTICS.FOCUS, 'POST', payload);
      const response = await client.post<StatisticsEntry>(STATISTICS.FOCUS, payload);
      
      logger.info('Focus time added successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(STATISTICS.FOCUS, error, { minutes });
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to record focus time.'
        : 'Failed to record focus time.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Increment sessions
   */
  async incrementSessions(count: number = 1): Promise<StatisticsEntry> {
    try {
      const currentDate = timeService.getCurrentDate();
      
      const payload = { 
        increment: count,  // Backend expects: {"increment": int}
        current_date: currentDate  // Send current date to backend
      };
      
      logger.apiCall(STATISTICS.SESSIONS, 'POST', payload);
      const response = await client.post<StatisticsEntry>(STATISTICS.SESSIONS, payload);
      
      logger.info('Sessions incremented successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(STATISTICS.SESSIONS, error, { increment: count });
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to record session.'
        : 'Failed to record session.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Increment tasks
   */
  async incrementTasks(count: number = 1): Promise<StatisticsEntry> {
    try {
      const currentDate = timeService.getCurrentDate();
      
      const payload = {
        increment: count,  // Backend expects: {"increment": int}
        current_date: currentDate  // Send current date to backend
      };
      
      logger.apiCall(STATISTICS.TASKS, 'POST', payload);
      const response = await client.post<StatisticsEntry>(STATISTICS.TASKS, payload);
      
      logger.info('Tasks incremented successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(STATISTICS.TASKS, error, { increment: count });
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to record task completion.'
        : 'Failed to record task completion.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update statistics for a specific date
   */
  async updateStatistics(date: string, updates: StatisticsRequest): Promise<StatisticsEntry> {
    try {
      logger.apiCall(`${STATISTICS.BASE}/${date}`, 'PUT', updates);
      const response = await client.put<StatisticsEntry>(`${STATISTICS.BASE}/${date}`, updates);
      logger.info('Statistics updated successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(`${STATISTICS.BASE}/${date}`, error, updates);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to update statistics.'
        : 'Failed to update statistics.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use filter-based approach to test API
      console.log(`🔍 [HEALTH CHECK] Testing with filter: D`);
      await this.getStatisticsByFilter('D');
      return true;
    } catch (error) {
      logger.warn('Health check failed - API not available', error, 'API');
      return false;
    }
  },

  /**
   * Get detailed statistics with daily breakdown
   */
  async getDetailedStatistics(filter: 'D' | 'W' | 'M'): Promise<DetailedStatisticsResponse> {
    try {
      logger.apiCall(`${STATISTICS.BASE}/detailed`, 'GET', { filter });
      const response = await client.get<DetailedStatisticsResponse>(`${STATISTICS.BASE}/detailed`, {
        params: { filter }
      });
      return response.data || { summary: { focusTime: 0, sessions: 0, tasksDone: 0 }, daily: [] };
    } catch (error: unknown) {
      logApiError(`${STATISTICS.BASE}/detailed`, error, { filter });
      return { summary: { focusTime: 0, sessions: 0, tasksDone: 0 }, daily: [] };
    }
  },

  /**
   * Get detailed statistics for custom date range
   */
  async getDetailedStatisticsByDateRange(startDate: string, endDate: string): Promise<DetailedStatisticsResponse> {
    try {
      logger.apiCall(`${STATISTICS.BASE}/detailed`, 'GET', { startDate, endDate });
      const response = await client.get<DetailedStatisticsResponse>(`${STATISTICS.BASE}/detailed`, {
        params: { startDate, endDate }
      });
      return response.data || { summary: { focusTime: 0, sessions: 0, tasksDone: 0 }, daily: [] };
    } catch (error: unknown) {
      logApiError(`${STATISTICS.BASE}/detailed`, error, { startDate, endDate });
      return { summary: { focusTime: 0, sessions: 0, tasksDone: 0 }, daily: [] };
    }
  }
}; 